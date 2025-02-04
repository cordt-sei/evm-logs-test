// scripts/proto_encoder.ts

import { TsProtoGeneratedType } from "@cosmjs/proto-signing";
import protobuf from "protobufjs/minimal.js";
import Long from "long";

interface InstantiateMessage {
  sender?: string;
  codeId?: number | Long;
  label?: string;
  msg?: Uint8Array;
  funds?: any[];
  admin?: string;
}

export const instantiateContractEncoding: TsProtoGeneratedType = {
  encode: (
    message: InstantiateMessage,
    writer: protobuf.Writer = protobuf.Writer.create()
  ): protobuf.Writer => {
    if (message.sender) writer.uint32(10).string(message.sender);
    if (message.codeId !== undefined) {
      // Change: Use tag 18 for bytes encoding and properly encode as bytes
      writer.uint32(18).bytes(Buffer.from(message.codeId.toString()));
    }
    if (message.label) writer.uint32(26).string(message.label);
    if (message.msg && message.msg.length) writer.uint32(34).bytes(message.msg);
    if (message.funds && message.funds.length) {
      for (const v of message.funds) {
        writer.uint32(42).bytes(v);
      }
    }
    if (message.admin) writer.uint32(50).string(message.admin);
    return writer;
  },
  decode: (input: Uint8Array | protobuf.Reader, length?: number): any => {
    return {};
  },
  fromPartial: (object: Partial<InstantiateMessage>): any => ({ ...object }),
};

interface RegisterPointerMessage {
  sender?: string;
  pointer_type?: number;
  erc_address?: string;
}

export const registerPointerEncoding: TsProtoGeneratedType = {
  encode: (
    message: RegisterPointerMessage,
    writer: protobuf.Writer = protobuf.Writer.create()
  ): protobuf.Writer => {
    if (message.sender) writer.uint32(10).string(message.sender);
    if (message.pointer_type !== undefined)
      writer.uint32(16).uint32(message.pointer_type);
    if (message.erc_address)
      writer.uint32(26).string(message.erc_address);
    return writer;
  },
  decode: (input: Uint8Array | protobuf.Reader, length?: number): any => {
    return {};
  },
  fromPartial: (object: Partial<RegisterPointerMessage>): any => ({ ...object }),
};

interface StoreCodeMessage {
  sender?: string;
  wasmByteCode?: Uint8Array;
  instantiatePermission?: Uint8Array;
}

export const storeCodeEncoding: TsProtoGeneratedType = {
  encode: (
    message: StoreCodeMessage,
    writer: protobuf.Writer = protobuf.Writer.create()
  ): protobuf.Writer => {
    if (message.sender) writer.uint32(10).string(message.sender);
    if (message.wasmByteCode?.length) {
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
  fromPartial: (object: Partial<StoreCodeMessage>): any => ({ ...object }),
};

interface ExecuteContractMessage {
  sender?: string;
  contract?: string;
  msg?: Uint8Array;
  funds?: Uint8Array[];
}

export const executeContractEncoding: TsProtoGeneratedType = {
  encode: (
    message: ExecuteContractMessage,
    writer: protobuf.Writer = protobuf.Writer.create()
  ): protobuf.Writer => {
    if (message.sender) writer.uint32(10).string(message.sender);
    if (message.contract) writer.uint32(18).string(message.contract);
    if (message.msg) writer.uint32(26).bytes(message.msg);
    if (message.funds?.length) {
      for (const v of message.funds) {
        writer.uint32(34).bytes(v);
      }
    }
    return writer;
  },
  decode: (input: Uint8Array | protobuf.Reader, length?: number): any => {
    return {};
  },
  fromPartial: (object: Partial<ExecuteContractMessage>): any => ({ ...object }),
};
