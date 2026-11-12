/* istanbul ignore file */

import assert from "node:assert";
import {EventEmitter} from "node:events";

import {Queue, Waitress, wait} from "../../../utils";
import {logger} from "../../../utils/logger";
import type {AdapterTransport} from "../../transport";
import {FRAMES} from "./commands";
import type {Frame} from "./frame";
import {Parser} from "./parser";
import {Writer} from "./writer";

const NS = "zh:blz:uart";

type BLZPacket = {
    frameId: number;
};

type BLZPacketMatcher = {
    frameId: number;
};

export class SerialDriver extends EventEmitter {
    private readonly transport: AdapterTransport;
    private writer: Writer;
    private parser: Parser;
    private initialized: boolean;
    private sendSeq = 0; // next frame number to send
    private recvSeq = 0; // next frame number to receive

    private waitress: Waitress<BLZPacket, BLZPacketMatcher>;
    private queue: Queue;

    constructor(transport: AdapterTransport) {
        super();
        this.transport = transport;
        this.initialized = false;
        this.queue = new Queue(1);
        this.waitress = new Waitress<BLZPacket, BLZPacketMatcher>(this.waitressValidator, this.waitressTimeoutFormatter);
        this.writer = new Writer();
        this.parser = new Parser();
        this.writer.on("data", this.onWriterData);
        this.parser.on("parsed", this.onParsed.bind(this));
    }

    /**
     * The transport is shared by every SerialDriver the adapter creates over its lifetime (the driver builds a new one on each
     * reset), so listeners are attached on connect and detached on close to keep a stale instance from parsing or ACKing frames.
     */
    private attachTransport(): void {
        this.detachTransport();
        this.transport.on("data", this.onTransportData);
        this.transport.on("close", this.onTransportClose);
    }

    private detachTransport(): void {
        this.transport.off("data", this.onTransportData);
        this.transport.off("close", this.onTransportClose);
    }

    private readonly onTransportData = (chunk: Buffer): void => {
        this.parser.write(chunk);
    };

    private readonly onTransportClose = (error?: boolean | Error): void => {
        logger.debug(`Port closed. Error? ${error}`, NS);

        // the base adapter reports `disconnected` for any unexpected close; an error close also tries a reset
        if (error != null && error !== false) {
            this.emit("reset");
        } else {
            this.initialized = false;
        }
    };

    private readonly onWriterData = (buffer: Buffer): void => {
        try {
            this.transport.write(buffer);
        } catch (error) {
            logger.error(`Write failed: ${error}`, NS);
        }
    };

    async connect(): Promise<void> {
        assert(this.transport.options.path, "BLZ serial port path is required");
        this.attachTransport();

        try {
            // BLZ frames are binary: XON/XOFF bytes in a payload must not be taken as software flow control
            await this.transport.open(true);
            logger.debug("Transport opened", NS);

            if (!this.transport.isSerial) {
                await this.reset();
            }

            this.initialized = true;
        } catch (error) {
            this.initialized = false;
            this.detachTransport();
            await this.transport.close();
            throw error;
        }
    }

    private async onParsed(frame: Frame): Promise<void> {
        try {
            if ((frame.control & 0x80) !== 0) {
                frame.checkCRC();
            }
            const frmNum = frame.sequence & 0x0f;
            const reTx = frame.control & 0x01;

            this.recvSeq = (frmNum + 1) & 0x0f;
            logger.debug(`<-- Frame (${frmNum}, ${reTx}): ${frame}`, NS);

            switch (frame.frameId) {
                case 0x0001:
                    this.handleACK(frame);
                    break;
                case 0x0002:
                    await this.handleError(frame);
                    break;
                case 0x0003:
                    this.handleReset(frame);
                    break;
                case 0x0004:
                    this.handleResetAck(frame);
                    break;
                default:
                    this.handleDATA(frame);
            }
        } catch (error) {
            logger.error(`Error parsing frame: ${error}`, NS);
        }
    }

    private handleDATA(frame: Frame): void {
        // // Log frame immediately before any processing
        // logger.debug(`<-- Processed FRAME (${frame.frameId.toString(16)}): ${frame}`, NS);

        // // Special handling for APS indication frames
        // if (frame.frameId === 0x0082) { // APS indication
        //     this.emit('apsIndication', frame.buffer);
        //     this.writer.sendACK(frame.sequence & 0x07);
        //     return;
        // }

        const handled = this.waitress.resolve({frameId: frame.frameId});
        if (!handled) {
            logger.debug(`Unsolicited frame ID ${frame.frameId.toString(16)}`, NS);
        }

        this.writer.sendACK(frame.sequence & 0x07);
        this.emit("received", frame.buffer);
    }

    private handleACK(frame: Frame): void {
        const ackSeq = (frame.control & 0x70) >> 4;
        const handled = this.waitress.resolve({frameId: frame.frameId});
        if (!handled) {
            logger.debug(`Unexpected packet sequence ${ackSeq} `, NS);
        } else {
            logger.debug(`<-- ACK (${ackSeq}): ${frame}`, NS);
        }
    }

    private handleResetAck(frame: Frame): void {
        logger.debug(`<-- RESET_ACK: ${frame}`, NS);
        // this.waitress.resolve({frameId: -1});
    }

    private handleError(_frame: Frame): void {
        logger.error("<-- Error: NCP is in error state", NS);
        // await this.reset();
    }

    async reset(): Promise<void> {
        this.parser.reset();
        this.queue.clear();
        this.sendSeq = 0;
        this.recvSeq = 0;

        return await this.queue.execute(() => {
            try {
                logger.debug(`UART reset: sending reset frame with seq=${this.sendSeq}, ackSeq=${this.recvSeq}`, NS);
                this.writer.sendReset(this.sendSeq, this.recvSeq);
                logger.debug("UART reset frame sent successfully", NS);
                return Promise.resolve();
            } catch (e) {
                logger.error(`Reset failed: ${e}`, NS);
                this.emit("reset");
                return Promise.reject(new Error(`Reset error: ${e}`));
            }
        });
    }

    private handleReset(frame: Frame): void {
        logger.warning(`<-- RST:  ${frame}`, NS);
    }

    public async close(): Promise<void> {
        logger.debug("Closing UART", NS);
        this.queue.clear();
        this.waitress.clear();
        this.parser.reset();
        this.detachTransport();

        if (this.initialized) {
            this.initialized = false;
            await this.transport.close();
        }
    }

    public isInitialized(): boolean {
        return this.initialized;
    }

    public async sendDATA(data: Buffer, frameId: number, retries = 2): Promise<void> {
        const seq = this.sendSeq;
        const ackSeq = this.recvSeq;

        for (let attempt = 0; attempt <= retries; attempt++) {
            const isRetransmission = attempt > 0;
            const waiter = this.waitFor(frameId, 1000); // 1 second timeout per attempt

            try {
                this.writer.sendData(data, seq, ackSeq, frameId, true, isRetransmission);
                this.sendSeq = (seq + 1) & 0x0f;

                // Don't wait for response if this is a reset command
                if (frameId !== FRAMES.reset.ID) {
                    await waiter.start().promise;
                }
                return;
            } catch (e) {
                this.waitress.remove(waiter.ID);
                logger.error(`Attempt ${attempt + 1} failed for seq ${seq}: ${e}`, NS);

                if (attempt === retries) {
                    logger.error(`All retries failed for seq ${seq}.`, NS);
                    throw new Error(`Failed to send data after ${retries} retries`);
                }

                // Wait before retry
                await wait(1000);
            }
        }
    }

    public waitFor(frameId: number, timeout = 3000): {start: () => {promise: Promise<BLZPacket>; ID: number}; ID: number} {
        return this.waitress.waitFor({frameId}, timeout);
    }

    private waitressTimeoutFormatter(matcher: BLZPacketMatcher, timeout: number): string {
        return `${JSON.stringify(matcher)} after ${timeout}ms`;
    }

    private waitressValidator(payload: BLZPacket, matcher: BLZPacketMatcher): boolean {
        return payload.frameId === matcher.frameId;
    }
}
