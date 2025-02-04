// scripts/registry.ts

import { Registry, GeneratedType } from "@cosmjs/proto-signing";
import { defaultRegistryTypes as defaultStargateTypes } from "@cosmjs/stargate";
import protobuf from 'protobufjs/minimal.js';

export const MSG_REGISTER_POINTER_TYPE_URL = "/seiprotocol.seichain.evm.MsgRegisterPointer";

const wasmEncoder = {
    encode(message: any, writer: protobuf.Writer = protobuf.Writer.create()): protobuf.Writer {
        if (message.sender) writer.uint32(10).string(message.sender);
        if (message.contract) writer.uint32(18).string(message.contract);
        if (message.msg) writer.uint32(26).bytes(message.msg);
        if (message.funds?.length) {
            for (const v of message.funds) writer.uint32(34).bytes(v);
        }
        return writer;
    },
    decode(input: protobuf.Reader | Uint8Array, length?: number): any {
        const reader = input instanceof protobuf.Reader ? input : new protobuf.Reader(input);
        const end = length === undefined ? reader.len : reader.pos + length;
        const message: any = {};
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1: message.sender = reader.string(); break;
                case 2: message.contract = reader.string(); break;
                case 3: message.msg = reader.bytes(); break;
                case 4:
                    if (!message.funds) message.funds = [];
                    message.funds.push(reader.bytes());
                    break;
                default: reader.skipType(tag & 7); break;
            }
        }
        return message;
    },
    fromPartial: (object: any): any => ({ ...object })
};

const storeCodeEncoder: GeneratedType = {
    encode(message: any, writer: protobuf.Writer = protobuf.Writer.create()): protobuf.Writer {
        if (message.sender) writer.uint32(10).string(message.sender);
        if (message.wasmByteCode?.length) writer.uint32(18).bytes(message.wasmByteCode);
        if (message.instantiatePermission) writer.uint32(42).bytes(message.instantiatePermission);
        return writer;
    },
    decode(input: protobuf.Reader | Uint8Array, length?: number): any {
        const reader = input instanceof protobuf.Reader ? input : new protobuf.Reader(input);
        const end = length === undefined ? reader.len : reader.pos + length;
        const message: any = {};
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1: message.sender = reader.string(); break;
                case 2: message.wasmByteCode = reader.bytes(); break;
                case 5: message.instantiatePermission = reader.bytes(); break;
                default: reader.skipType(tag & 7); break;
            }
        }
        return message;
    },
    fromPartial: (object: any): any => ({
        sender: object.sender ?? "",
        wasmByteCode: object.wasmByteCode ?? new Uint8Array(),
        instantiatePermission: object.instantiatePermission
    })
};

const instantiateEncoder: GeneratedType = {
  encode(message: any, writer: protobuf.Writer = protobuf.Writer.create()): protobuf.Writer {
      if (message.sender) writer.uint32(10).string(message.sender);
      if (message.admin) writer.uint32(18).string(message.admin);
      writer.uint32(24).uint64(Number(message.code_id || message.codeId || 0));
      if (message.label) writer.uint32(34).string(message.label);
      if (message.msg) writer.uint32(42).bytes(message.msg);
      if (message.funds?.length) {
          for (const v of message.funds) {
              writer.uint32(50).bytes(v);
          }
      }
      return writer;
  },
    decode(input: protobuf.Reader | Uint8Array, length?: number): any {
        const reader = input instanceof protobuf.Reader ? input : new protobuf.Reader(input);
        const end = length === undefined ? reader.len : reader.pos + length;
        const message: any = {};
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1: message.sender = reader.string(); break;
                case 2: message.admin = reader.string(); break;
                case 3: message.code_id = reader.uint64(); break;
                case 4: message.label = reader.string(); break;
                case 5: message.msg = reader.bytes(); break;
                case 6:
                    if (!message.funds) message.funds = [];
                    message.funds.push(reader.bytes());
                    break;
                default: reader.skipType(tag & 7); break;
            }
        }
        return message;
    },
    fromPartial: (object: any): any => ({
        sender: object.sender ?? "",
        admin: object.admin ?? "",
        code_id: object.code_id || object.codeId || "0",
        label: object.label ?? "",
        msg: object.msg ?? new Uint8Array(),
        funds: object.funds ?? []
    })
};

const wasmTypes: [string, GeneratedType][] = [
    ["/cosmwasm.wasm.v1.MsgExecuteContract", wasmEncoder],
    ["/cosmwasm.wasm.v1.MsgStoreCode", storeCodeEncoder],
    ["/cosmwasm.wasm.v1.MsgInstantiateContract", instantiateEncoder]
];

const registerPointerType: GeneratedType = {
    encode(message: any, writer: protobuf.Writer = protobuf.Writer.create()): protobuf.Writer {
        if (message.sender) writer.uint32(10).string(message.sender);
        if (message.pointer_type !== undefined) writer.uint32(16).uint32(message.pointer_type);
        if (message.erc_address) writer.uint32(26).string(message.erc_address);
        return writer;
    },
    decode(input: protobuf.Reader | Uint8Array, length?: number): any {
        const reader = input instanceof protobuf.Reader ? input : new protobuf.Reader(input);
        const end = length === undefined ? reader.len : reader.pos + length;
        const message = { sender: "", pointer_type: 0, erc_address: "" };
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1: message.sender = reader.string(); break;
                case 2: message.pointer_type = reader.uint32(); break;
                case 3: message.erc_address = reader.string(); break;
                default: reader.skipType(tag & 7); break;
            }
        }
        return message;
    },
    fromPartial: (object: any): any => ({ 
        sender: object.sender ?? "",
        pointer_type: object.pointer_type ?? 0,
        erc_address: object.erc_address ?? ""
    })
};

export function createRegistry(): Registry {
    const registry = new Registry([...defaultStargateTypes, ...wasmTypes]);
    registry.register(MSG_REGISTER_POINTER_TYPE_URL, registerPointerType);
    return registry;
}