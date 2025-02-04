import { TsProtoGeneratedType } from "@cosmjs/proto-signing";
import protobuf from "protobufjs/minimal.js";
import Long from "long";

interface BaseMessage {
    sender?: string;
}

interface InstantiateMessage extends BaseMessage {
    admin?: string;
    codeId?: number | Long;
    label?: string;
    msg?: Uint8Array;
    funds?: Uint8Array[];
}

interface RegisterPointerMessage extends BaseMessage {
    pointer_type?: number;
    erc_address?: string;
}

interface StoreCodeMessage extends BaseMessage {
    wasmByteCode?: Uint8Array;
    instantiatePermission?: Uint8Array;
}

interface ExecuteContractMessage extends BaseMessage {
    contract?: string;
    msg?: Uint8Array;
    funds?: Uint8Array[];
}

export const instantiateContractEncoding: TsProtoGeneratedType = {
    encode(message: InstantiateMessage, writer: protobuf.Writer = protobuf.Writer.create()): protobuf.Writer {
        if (message.sender) {
            writer.uint32(10).string(message.sender);
        }
        if (message.admin) {
            writer.uint32(18).string(message.admin);
        }
        if (message.codeId !== undefined) {
            const longValue = typeof message.codeId === 'number' ? 
                Long.fromNumber(message.codeId) : 
                message.codeId;
            writer.uint32(24).uint64(longValue);
        }
        if (message.label) {
            writer.uint32(34).string(message.label);
        }
        if (message.msg?.length) {
            writer.uint32(42).bytes(message.msg);
        }
        if (message.funds?.length) {
            for (const v of message.funds) {
                writer.uint32(50).bytes(v);
            }
        }
        return writer;
    },

    decode(input: Uint8Array | protobuf.Reader, length?: number): InstantiateMessage {
        const reader = input instanceof protobuf.Reader ? input : protobuf.Reader.create(input);
        const end = length === undefined ? reader.len : reader.pos + length;
        const message: InstantiateMessage = {};
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.sender = reader.string();
                    break;
                case 2:
                    message.admin = reader.string();
                    break;
                case 3:
                    message.codeId = reader.uint64() as Long;
                    break;
                case 4:
                    message.label = reader.string();
                    break;
                case 5:
                    message.msg = reader.bytes();
                    break;
                case 6:
                    if (!message.funds) {
                        message.funds = [];
                    }
                    message.funds.push(reader.bytes());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromPartial(object: Partial<InstantiateMessage>): InstantiateMessage {
        const message: InstantiateMessage = {};
        message.sender = object.sender ?? undefined;
        message.admin = object.admin ?? undefined;
        message.codeId = object.codeId ?? undefined;
        message.label = object.label ?? undefined;
        message.msg = object.msg ?? undefined;
        message.funds = object.funds?.slice() ?? undefined;
        return message;
    }
};

export const registerPointerEncoding: TsProtoGeneratedType = {
    encode(message: RegisterPointerMessage, writer: protobuf.Writer = protobuf.Writer.create()): protobuf.Writer {
        if (message.sender) {
            writer.uint32(10).string(message.sender);
        }
        if (message.pointer_type !== undefined) {
            writer.uint32(16).uint32(message.pointer_type);
        }
        if (message.erc_address) {
            writer.uint32(26).string(message.erc_address);
        }
        return writer;
    },

    decode(input: Uint8Array | protobuf.Reader, length?: number): RegisterPointerMessage {
        const reader = input instanceof protobuf.Reader ? input : protobuf.Reader.create(input);
        const end = length === undefined ? reader.len : reader.pos + length;
        const message: RegisterPointerMessage = {};
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.sender = reader.string();
                    break;
                case 2:
                    message.pointer_type = reader.uint32();
                    break;
                case 3:
                    message.erc_address = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromPartial(object: Partial<RegisterPointerMessage>): RegisterPointerMessage {
        const message: RegisterPointerMessage = {};
        message.sender = object.sender ?? undefined;
        message.pointer_type = object.pointer_type ?? undefined;
        message.erc_address = object.erc_address ?? undefined;
        return message;
    }
};

export const storeCodeEncoding: TsProtoGeneratedType = {
    encode(message: StoreCodeMessage, writer: protobuf.Writer = protobuf.Writer.create()): protobuf.Writer {
        if (message.sender) {
            writer.uint32(10).string(message.sender);
        }
        if (message.wasmByteCode?.length) {
            writer.uint32(18).bytes(message.wasmByteCode);
        }
        if (message.instantiatePermission) {
            writer.uint32(42).bytes(message.instantiatePermission);
        }
        return writer;
    },

    decode(input: Uint8Array | protobuf.Reader, length?: number): StoreCodeMessage {
        const reader = input instanceof protobuf.Reader ? input : protobuf.Reader.create(input);
        const end = length === undefined ? reader.len : reader.pos + length;
        const message: StoreCodeMessage = {};
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.sender = reader.string();
                    break;
                case 2:
                    message.wasmByteCode = reader.bytes();
                    break;
                case 5:
                    message.instantiatePermission = reader.bytes();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromPartial(object: Partial<StoreCodeMessage>): StoreCodeMessage {
        const message: StoreCodeMessage = {};
        message.sender = object.sender ?? undefined;
        message.wasmByteCode = object.wasmByteCode ?? undefined;
        message.instantiatePermission = object.instantiatePermission ?? undefined;
        return message;
    }
};

export const executeContractEncoding: TsProtoGeneratedType = {
    encode(message: ExecuteContractMessage, writer: protobuf.Writer = protobuf.Writer.create()): protobuf.Writer {
        if (message.sender) {
            writer.uint32(10).string(message.sender);
        }
        if (message.contract) {
            writer.uint32(18).string(message.contract);
        }
        if (message.msg) {
            writer.uint32(26).bytes(message.msg);
        }
        if (message.funds?.length) {
            for (const v of message.funds) {
                writer.uint32(34).bytes(v);
            }
        }
        return writer;
    },

    decode(input: Uint8Array | protobuf.Reader, length?: number): ExecuteContractMessage {
        const reader = input instanceof protobuf.Reader ? input : protobuf.Reader.create(input);
        const end = length === undefined ? reader.len : reader.pos + length;
        const message: ExecuteContractMessage = {};
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.sender = reader.string();
                    break;
                case 2:
                    message.contract = reader.string();
                    break;
                case 3:
                    message.msg = reader.bytes();
                    break;
                case 4:
                    if (!message.funds) {
                        message.funds = [];
                    }
                    message.funds.push(reader.bytes());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromPartial(object: Partial<ExecuteContractMessage>): ExecuteContractMessage {
        const message: ExecuteContractMessage = {};
        message.sender = object.sender ?? undefined;
        message.contract = object.contract ?? undefined;
        message.msg = object.msg ?? undefined;
        message.funds = object.funds?.slice() ?? undefined;
        return message;
    }
};