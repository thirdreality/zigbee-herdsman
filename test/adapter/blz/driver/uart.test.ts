import {EventEmitter} from "node:events";
import {beforeEach, describe, expect, it, vi} from "vitest";
import {Frame} from "../../../../src/adapter/blz/driver/frame";
import {Parser} from "../../../../src/adapter/blz/driver/parser";
import {SerialDriver} from "../../../../src/adapter/blz/driver/uart";
import {Writer} from "../../../../src/adapter/blz/driver/writer";
import type {AdapterTransport} from "../../../../src/adapter/transport";
import type {TransportOptions} from "../../../../src/adapter/tstype";

vi.mock("../../../../src/adapter/blz/driver/parser");
vi.mock("../../../../src/adapter/blz/driver/writer");

// Don't mock Frame since we need its actual implementation
vi.mock("../../../../src/adapter/blz/driver/frame", () => {
    return {
        Frame: vi.fn().mockImplementation((buffer: Buffer) => {
            return {
                control: buffer[0],
                sequence: buffer[1],
                frameId: buffer.readUInt16LE(2),
                payload: buffer.subarray(4, -2),
                buffer: buffer,
                checkCRC: vi.fn(),
                toString: () => buffer.toString("hex"),
            };
        }),
    };
});

class FakeTransport extends EventEmitter {
    options: TransportOptions = {path: "/dev/ttyUSB0", baudRate: 2000000, rtscts: false};
    isSerial = true;
    open = vi.fn((_noFlowCtrl?: boolean) => Promise.resolve());
    close = vi.fn(() => Promise.resolve());
    write = vi.fn((_data: Buffer) => true);
}

type ParserMock = {
    on: ReturnType<typeof vi.fn>;
    reset: ReturnType<typeof vi.fn>;
    write: ReturnType<typeof vi.fn>;
};

type WriterMock = {
    on: ReturnType<typeof vi.fn>;
    sendACK: ReturnType<typeof vi.fn>;
    sendReset: ReturnType<typeof vi.fn>;
    sendData: ReturnType<typeof vi.fn>;
};

describe("BLZ Serial Driver", () => {
    let transport: FakeTransport;
    let driver: SerialDriver;
    let parsers: ParserMock[];
    let writers: WriterMock[];
    let parserMock: ParserMock;
    let writerMock: WriterMock;

    function createFrame(frameId: number, sequence: number, control: number, payload?: Buffer): Frame {
        const headerLength = 4; // control + sequence + frameId
        const crcLength = 2;
        const payloadLength = payload ? payload.length : 0;
        const buffer = Buffer.alloc(headerLength + payloadLength + crcLength);

        buffer[0] = control;
        buffer[1] = sequence;
        buffer.writeUInt16LE(frameId, 2);

        if (payload) {
            payload.copy(buffer, headerLength);
        }

        // Mock CRC bytes
        buffer[buffer.length - 2] = 0xff;
        buffer[buffer.length - 1] = 0xff;

        return new Frame(buffer);
    }

    beforeEach(() => {
        parsers = [];
        writers = [];
        vi.mocked(Parser).mockImplementation(() => {
            const parser: ParserMock = {on: vi.fn(), reset: vi.fn(), write: vi.fn()};
            parsers.push(parser);
            return parser as unknown as Parser;
        });
        vi.mocked(Writer).mockImplementation(() => {
            const writer: WriterMock = {on: vi.fn(), sendACK: vi.fn(), sendReset: vi.fn(), sendData: vi.fn()};
            writers.push(writer);
            return writer as unknown as Writer;
        });

        transport = new FakeTransport();
        driver = new SerialDriver(transport as unknown as AdapterTransport);
        parserMock = parsers[0];
        writerMock = writers[0];
    });

    describe("Connection", () => {
        it("rejects a missing serial path before opening hardware", async () => {
            transport.options = {...transport.options, path: undefined};

            await expect(driver.connect()).rejects.toThrow("BLZ serial port path is required");
            expect(transport.open).not.toHaveBeenCalled();
        });

        it("opens the transport without software flow control", async () => {
            await driver.connect();

            expect(transport.open).toHaveBeenCalledWith(true);
            expect(writerMock.sendReset).not.toHaveBeenCalled();
            expect(driver.isInitialized()).toBe(true);
            expect(transport.listenerCount("data")).toBe(1);
            expect(transport.listenerCount("close")).toBe(1);
        });

        it("sends a UART reset after opening a TCP transport", async () => {
            transport.isSerial = false;

            await driver.connect();

            expect(writerMock.sendReset).toHaveBeenCalledWith(0, 0);
            expect(driver.isInitialized()).toBe(true);
        });

        it("closes the transport and detaches when opening fails", async () => {
            transport.open.mockRejectedValueOnce(new Error("Connection failed"));

            await expect(driver.connect()).rejects.toThrow("Connection failed");
            expect(driver.isInitialized()).toBe(false);
            expect(transport.close).toHaveBeenCalled();
            expect(transport.listenerCount("data")).toBe(0);
        });

        it("does not stack transport listeners when connecting again", async () => {
            await driver.connect();
            await driver.connect();

            expect(transport.listenerCount("data")).toBe(1);
            expect(transport.listenerCount("close")).toBe(1);
        });

        it("closes the transport and detaches on close", async () => {
            await driver.connect();
            await driver.close();

            expect(transport.close).toHaveBeenCalled();
            expect(driver.isInitialized()).toBe(false);
            expect(transport.listenerCount("data")).toBe(0);
            expect(transport.listenerCount("close")).toBe(0);
        });

        it("stops feeding a closed driver once a new driver takes over the transport", async () => {
            await driver.connect();
            await driver.close();

            const next = new SerialDriver(transport as unknown as AdapterTransport);
            await next.connect();
            transport.emit("data", Buffer.from([0x42, 0x4c]));

            expect(parsers[0].write).not.toHaveBeenCalled();
            expect(parsers[1].write).toHaveBeenCalledWith(Buffer.from([0x42, 0x4c]));
        });
    });

    describe("Transport data", () => {
        beforeEach(async () => {
            await driver.connect();
        });

        it("feeds received bytes to the parser", () => {
            transport.emit("data", Buffer.from([1, 2, 3]));

            expect(parserMock.write).toHaveBeenCalledWith(Buffer.from([1, 2, 3]));
        });

        it("writes encoded frames to the transport", () => {
            writerMock.on.mock.calls.find((call) => call[0] === "data")?.[1](Buffer.from([0x42, 0x4c]));

            expect(transport.write).toHaveBeenCalledWith(Buffer.from([0x42, 0x4c]));
        });

        it("logs instead of throwing when the transport rejects a write", () => {
            transport.write.mockImplementationOnce(() => {
                throw new Error("Cannot write while transport is closed");
            });

            expect(() => writerMock.on.mock.calls.find((call) => call[0] === "data")?.[1](Buffer.from([0x42]))).not.toThrow();
        });
    });

    describe("Frame handling", () => {
        beforeEach(async () => {
            await driver.connect();
        });

        it("should handle DATA frames", () => {
            const callback = vi.fn();
            driver.on("received", callback);

            const payload = Buffer.from([1, 2, 3]);
            const frame = createFrame(0x0000, 0x01, 0x00, payload);

            parserMock.on.mock.calls.find((call) => call[0] === "parsed")?.[1](frame);

            expect(writerMock.sendACK).toHaveBeenCalledWith(frame.sequence & 0x07);
            expect(callback).toHaveBeenCalledWith(frame.buffer);
        });

        it("should handle ACK frames", () => {
            const frame = createFrame(0x0001, 0x01, 0x00);

            parserMock.on.mock.calls.find((call) => call[0] === "parsed")?.[1](frame);

            // ACK frames are handled internally by the waitress
            expect(writerMock.sendACK).not.toHaveBeenCalled();
        });

        it("should handle RESET frames", () => {
            const frame = createFrame(0x0003, 0x01, 0x00);

            parserMock.on.mock.calls.find((call) => call[0] === "parsed")?.[1](frame);

            // RESET frames are just logged
            expect(writerMock.sendACK).not.toHaveBeenCalled();
        });

        it("should handle ERROR frames", () => {
            const frame = createFrame(0x0002, 0x01, 0x00);

            parserMock.on.mock.calls.find((call) => call[0] === "parsed")?.[1](frame);

            // ERROR frames are just logged (reset is commented out in the actual code)
            // The frame is handled but no ACK is sent
            expect(writerMock.sendACK).not.toHaveBeenCalled();
        });
    });

    describe("Data sending", () => {
        beforeEach(async () => {
            await driver.connect();
        });

        it("should send data successfully", async () => {
            const data = Buffer.from([1, 2, 3]);
            const frameId = 0x0000;

            // Mock successful send with proper async timing
            writerMock.sendData.mockImplementation(() => {
                setImmediate(() => {
                    const frame = createFrame(frameId, 0x01, 0x00);
                    parserMock.on.mock.calls.find((call) => call[0] === "parsed")?.[1](frame);
                });
                return Promise.resolve();
            });

            await driver.sendDATA(data, frameId);
            expect(writerMock.sendData).toHaveBeenCalledWith(data, expect.any(Number), expect.any(Number), frameId, true, false);
        });

        it("should handle send failure with retries", async () => {
            const data = Buffer.from([1, 2, 3]);
            const frameId = 0x0000;

            // Mock failed send with proper timeout handling
            writerMock.sendData.mockImplementation(() => {
                return new Promise((resolve) => {
                    // Delay longer than the retry timeout to trigger failure
                    setTimeout(resolve, 100);
                });
            });

            await expect(driver.sendDATA(data, frameId, 1)).rejects.toThrow("Failed to send data after 1 retries");
            expect(writerMock.sendData).toHaveBeenCalledTimes(2); // Initial + 1 retry
        });
    });

    describe("Transport close", () => {
        beforeEach(async () => {
            await driver.connect();
        });

        it("requests a reset when the transport closes with an error", () => {
            const callback = vi.fn();
            driver.on("reset", callback);

            transport.emit("close", new Error("Close error"));

            expect(callback).toHaveBeenCalled();
        });

        it("marks the driver uninitialized on a clean close", () => {
            const callback = vi.fn();
            driver.on("reset", callback);

            transport.emit("close", false);

            expect(callback).not.toHaveBeenCalled();
            expect(driver.isInitialized()).toBe(false);
        });
    });
});
