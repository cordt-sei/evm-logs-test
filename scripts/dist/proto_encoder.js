// scripts/proto_encoder.ts
import protobuf from "protobufjs/minimal.js";
import Long from "long";
export const instantiateContractEncoding = {
    encode(message, writer = protobuf.Writer.create()) {
        if (message.sender) {
            writer.uint32(10).string(message.sender);
        }
        if (message.code_id !== undefined) {
            const long = Long.fromValue(message.code_id);
            writer.uint32(16).uint64(long);
        }
        if (message.label) {
            writer.uint32(26).string(message.label);
        }
        if (message.msg?.length) {
            writer.uint32(34).bytes(message.msg);
        }
        if (message.funds?.length) {
            for (const v of message.funds) {
                writer.uint32(42).bytes(v);
            }
        }
        if (message.admin) {
            writer.uint32(50).string(message.admin);
        }
        return writer;
    },
    decode(input, length) {
        const reader = input instanceof protobuf.Reader ? input : protobuf.Reader.create(input);
        const end = length === undefined ? reader.len : reader.pos + length;
        const message = {
            code_id: Long.UZERO,
            label: "",
            msg: new Uint8Array()
        };
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.sender = reader.string();
                    break;
                case 2:
                    message.code_id = reader.uint64();
                    break;
                case 3:
                    message.label = reader.string();
                    break;
                case 4:
                    message.msg = reader.bytes();
                    break;
                case 5:
                    if (!message.funds)
                        message.funds = [];
                    message.funds.push(reader.bytes());
                    break;
                case 6:
                    message.admin = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },
    fromPartial(object) {
        return {
            sender: object.sender ?? undefined,
            code_id: object.code_id ?? Long.UZERO,
            label: object.label ?? "",
            msg: object.msg ?? new Uint8Array(),
            funds: object.funds?.slice() ?? undefined,
            admin: object.admin ?? undefined
        };
    }
};
export const registerPointerEncoding = {
    encode(message, writer = protobuf.Writer.create()) {
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
    decode(input, length) {
        const reader = input instanceof protobuf.Reader ? input : protobuf.Reader.create(input);
        const end = length === undefined ? reader.len : reader.pos + length;
        const message = {};
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
    fromPartial(object) {
        const message = {};
        message.sender = object.sender ?? undefined;
        message.pointer_type = object.pointer_type ?? undefined;
        message.erc_address = object.erc_address ?? undefined;
        return message;
    }
};
export const storeCodeEncoding = {
    encode(message, writer = protobuf.Writer.create()) {
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
    decode(input, length) {
        const reader = input instanceof protobuf.Reader ? input : protobuf.Reader.create(input);
        const end = length === undefined ? reader.len : reader.pos + length;
        const message = {};
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
    fromPartial(object) {
        const message = {};
        message.sender = object.sender ?? undefined;
        message.wasmByteCode = object.wasmByteCode ?? undefined;
        message.instantiatePermission = object.instantiatePermission ?? undefined;
        return message;
    }
};
export const executeContractEncoding = {
    encode(message, writer = protobuf.Writer.create()) {
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
    decode(input, length) {
        const reader = input instanceof protobuf.Reader ? input : protobuf.Reader.create(input);
        const end = length === undefined ? reader.len : reader.pos + length;
        const message = {};
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
    fromPartial(object) {
        const message = {};
        message.sender = object.sender ?? undefined;
        message.contract = object.contract ?? undefined;
        message.msg = object.msg ?? undefined;
        message.funds = object.funds?.slice() ?? undefined;
        return message;
    }
};
