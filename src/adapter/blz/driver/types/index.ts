/* istanbul ignore file */

import {Bytes, fixed_list, int8s, LVBytes, LVList, list, uint_t, uint8_t, uint16_t, uint24_t, uint32_t, uint64_t, WordList} from "./basic";
import {BlzApsOption, BlzEUI64, BlzNodeId, BlzNodeType, BlzOutgoingMessageType, BlzStatus, BlzValueId, Bool} from "./named";
import {
    BlzApsFrame,
    BlzMultiAddress,
    BlzNeighbors,
    BlzNetworkParameters,
    BlzNodeDescriptor,
    BlzRoutingTable,
    BlzSimpleDescriptor,
    BlzStruct,
} from "./struct";

interface SchemaType {
    deserialize: (type: unknown, data: Buffer) => [unknown, Buffer];
    serialize: (schema: unknown, item: unknown) => Buffer;
}

export function deserialize(payload: Buffer, schema: SchemaType[]): unknown[] {
    const result: unknown[] = [];
    let value: unknown;
    let data = payload;
    for (const type of schema) {
        [value, data] = type.deserialize(type, data);
        result.push(value);
    }
    return result;
}

export function serialize(data: unknown[], schema: SchemaType[]): Buffer {
    return Buffer.concat(schema.map((s, idx) => s.serialize(s, data[idx])));
}

export {
    BlzApsFrame,
    BlzApsOption,
    BlzEUI64,
    BlzMultiAddress,
    BlzNeighbors,
    BlzNetworkParameters,
    BlzNodeDescriptor,
    /* Named Types */
    BlzNodeId,
    BlzNodeType,
    BlzOutgoingMessageType,
    BlzRoutingTable,
    BlzSimpleDescriptor,
    BlzStatus,
    /* Structs */
    BlzStruct,
    BlzValueId,
    Bool,
    Bytes,
    fixed_list,
    /* Basic Types */
    int8s,
    LVBytes,
    LVList,
    list,
    uint_t,
    uint8_t,
    uint16_t,
    uint24_t,
    uint32_t,
    uint64_t,
    WordList,
};
