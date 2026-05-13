import {describe, expect, it} from "vitest";

import {BLZFrameData} from "../../../../src/adapter/blz/driver/blz";
import {FRAMES} from "../../../../src/adapter/blz/driver/commands";

describe("BLZFrameData", () => {
    it("serializes frames with uint64 fields to JSON for debug logging", () => {
        const payload = Buffer.from("0000dddddddddddddddd621a0e0b00000000080000", "hex");
        const frame = BLZFrameData.createFrame(FRAMES.getNetworkParameters.ID, false, payload);

        expect(() => JSON.stringify(frame)).not.toThrow();
        expect(JSON.parse(JSON.stringify(frame))).toMatchObject({
            _cls_: "getNetworkParameters",
            extPanId: "0xdddddddddddddddd",
        });
    });
});
