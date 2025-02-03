// proto_encoder.ts
import { TsProtoGeneratedType } from "@cosmjs/proto-signing";
import protobuf from 'protobufjs/minimal.js';

export const registerPointerEncoding: TsProtoGeneratedType = {
  encode: (message: any, writer: protobuf.Writer = protobuf.Writer.create()): protobuf.Writer => {
    if (message.sender) writer.uint32(10).string(message.sender);
    if (message.pointer_type !== undefined) writer.uint32(16).uint32(message.pointer_type);
    if (message.erc_address) writer.uint32(26).string(message.erc_address);
    return writer;
  },
  decode: (input: Uint8Array | protobuf.Reader, length?: number): any => {
    return {};
  },
  fromPartial: (object: any) => ({ ...object })
};

export const storeCodeEncoding: TsProtoGeneratedType = {
  encode: (message: any, writer: protobuf.Writer = protobuf.Writer.create()): protobuf.Writer => {
    if (message.sender) writer.uint32(10).string(message.sender);
    if (message.wasmByteCode && message.wasmByteCode.length > 0) {
      writer.uint32(18).bytes(message.wasmByteCode);
    }
    if (message.instantiatePermission) {
      writer.uint32(42).bytes(message.instantiatePermission);
    }
    return writer;
  },
  decode: (input: Uint8Array | protobuf.Reader, length?: number): any => {
    return {};
  },
  fromPartial: (object: any) => ({ ...object })
};

export const instantiateContractEncoding: TsProtoGeneratedType = {
  encode: (message: any, writer: protobuf.Writer = protobuf.Writer.create()): protobuf.Writer => {
    if (message.sender) writer.uint32(10).string(message.sender);
    if (message.admin) writer.uint32(18).string(message.admin);
    if (message.codeId) writer.uint32(24).uint64(message.codeId);
    if (message.label) writer.uint32(34).string(message.label);
    if (message.msg) writer.uint32(42).bytes(message.msg);
    if (message.funds && message.funds.length) {
      for (const v of message.funds) {
        writer.uint32(50).bytes(v);
      }
    }
    return writer;
  },
  decode: (input: Uint8Array | protobuf.Reader, length?: number): any => {
    return {};
  },
  fromPartial: (object: any) => ({ ...object })
};

export const executeContractEncoding: TsProtoGeneratedType = {
  encode: (message: any, writer: protobuf.Writer = protobuf.Writer.create()): protobuf.Writer => {
    if (message.sender) writer.uint32(10).string(message.sender);
    if (message.contract) writer.uint32(18).string(message.contract);
    if (message.msg) writer.uint32(26).bytes(message.msg);
    if (message.funds && message.funds.length) {
      for (const v of message.funds) {
        writer.uint32(34).bytes(v);
      }
    }
    return writer;
  },
  decode: (input: Uint8Array | protobuf.Reader, length?: number): any => {
    return {};
  },
  fromPartial: (object: any) => ({ ...object })
};