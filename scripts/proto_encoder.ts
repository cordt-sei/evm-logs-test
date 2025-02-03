import { TsProtoGeneratedType } from "@cosmjs/proto-signing";
import protobuf from 'protobufjs/minimal.js';

export const registerPointerEncoding: TsProtoGeneratedType = {
 encode: (message: any, writer: protobuf.Writer = protobuf.Writer.create()): protobuf.Writer => {
   if (message.sender) writer.string(message.sender);
   if (message.pointer_type !== undefined) writer.uint32(message.pointer_type);
   if (message.erc_address) writer.string(message.erc_address);
   return writer;
 },
 decode: (input: Uint8Array | protobuf.Reader, length?: number): any => {
   return {};
 },
 fromPartial: (object: any) => ({ ...object })
};