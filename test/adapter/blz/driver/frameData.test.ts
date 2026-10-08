import {describe, expect, it} from "vitest";
import {BLZFrameData} from "../../../../src/adapter/blz/driver/blz";
import {FRAMES} from "../../../../src/adapter/blz/driver/commands";

describe("BLZ frame decoding boundaries", () => {
    it("rejects a truncated response instead of returning an undefined frame", () => {
        expect(() => BLZFrameData.createFrame(FRAMES.getValue.ID, false, Buffer.alloc(0))).toThrow("Unable to decode frame ID");
    });

    it("rejects a request without its required parameters", () => {
        expect(() => new BLZFrameData("getValue", true, undefined)).toThrow("Missing parameters for getValue");
    });

    it("still accepts a valid empty acknowledgement", () => {
        const frame = BLZFrameData.createFrame(FRAMES.ack.ID, true, Buffer.alloc(0));
        expect(frame.name).toBe("ack");
        expect(frame.serialize()).toEqual(Buffer.alloc(0));
    });
});
