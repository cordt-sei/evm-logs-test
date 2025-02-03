import protobuf from 'protobufjs/minimal.js';
export const registerPointerEncoding = {
    encode: (message, writer = protobuf.Writer.create()) => {
        if (message.sender)
            writer.string(message.sender);
        if (message.pointer_type !== undefined)
            writer.uint32(message.pointer_type);
        if (message.erc_address)
            writer.string(message.erc_address);
        return writer;
    },
    decode: (input, length) => {
        return {};
    },
    fromPartial: (object) => ({ ...object })
};
