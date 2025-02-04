import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { DirectSecp256k1HdWallet, Registry, GeneratedType } from "@cosmjs/proto-signing";
import { defaultRegistryTypes, GasPrice } from "@cosmjs/stargate";
import * as fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CONTRACT_PATH = join(__dirname, "../artifacts/evm_logs_test.wasm");
const RPC_ENDPOINT = "https://rpc.atlantic-2.seinetwork.io/";

// Configuration
const BATCH_SIZE = 10;
const NUM_BATCHES = 10;
const TOTAL_TOKENS = BATCH_SIZE * NUM_BATCHES;
const RECIPIENT = "sei14v72v7hgzuvgck6v6jsgjacxnt6kdmhm3hv6de";

// Just the minimum registry type for pointer registration
const registerPointerType: GeneratedType = {
    typeUrl: "/seiprotocol.seichain.evm.MsgRegisterPointer",
    encode: (msg: any) => new Uint8Array([
        0x0a, msg.sender.length, ...Buffer.from(msg.sender),
        0x10, msg.pointer_type,
        0x1a, msg.erc_address.length, ...Buffer.from(msg.erc_address)
    ]),
    decode: () => ({}),
    fromPartial: (x: any) => x
};

async function main() {
   try {
       const wallet = await DirectSecp256k1HdWallet.fromMnemonic(
           "tired zebra install glow own jeans unit shove diary brass super hover",
           { prefix: "sei" }
       );
       const [account] = await wallet.getAccounts();
       console.log(`Using account: ${account.address}`);

       const registry = new Registry(defaultRegistryTypes);
       // Only register our new type
       registry.register(registerPointerType.typeUrl, registerPointerType);

       const client = await SigningCosmWasmClient.connectWithSigner(
           RPC_ENDPOINT,
           wallet,
           { 
               gasPrice: GasPrice.fromString("0.1usei"),
               registry
           }
       );

       console.log("Uploading contract...");
       const wasm = fs.readFileSync(CONTRACT_PATH);
       const uploadResult = await client.upload(account.address, wasm, "auto");
       console.log(`Code ID: ${uploadResult.codeId}`);

       const instantiateMsg = {
           name: "EVM Logs Test",
           symbol: "EVT",
           minter: account.address
       };

       console.log("Instantiating...");
       const { contractAddress } = await client.instantiate(
           account.address,
           uploadResult.codeId,
           instantiateMsg,
           "EVM Logs Test NFT",
           "auto"
       );
       console.log(`Contract: ${contractAddress}`);

       // Register pointer 
       console.log("Registering pointer...");
       const registerPointerMsg = {
           typeUrl: "/seiprotocol.seichain.evm.MsgRegisterPointer",
           value: {
               sender: account.address,
               pointer_type: 4, // CW721
               erc_address: contractAddress
           }
       };

       const pointerResult = await client.signAndBroadcast(
           account.address,
           [registerPointerMsg],
           "auto"
       );
       console.log("Pointer registration tx hash:", pointerResult.transactionHash);

       // Extract pointer address
       let pointerAddress = '';
       for (const event of pointerResult.events) {
           for (const attr of event.attributes) {
               if (attr.key === "pointer_address") {
                   pointerAddress = attr.value;
                   break;
               }
           }
           if (pointerAddress) break;
       }
       console.log("Pointer address:", pointerAddress);

       console.log(`Minting ${TOTAL_TOKENS} tokens...`);
       for (let i = 0; i < TOTAL_TOKENS; i++) {
           await client.execute(
               account.address,
               contractAddress,
               { mint: { token_id: i.toString(), owner: account.address } },
               "auto"
           );
           if (i % 10 === 0) console.log(`Minted ${i}`);
       }

       const sends = Array.from({ length: NUM_BATCHES }, (_, batch) => ({
           typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
           value: {
               sender: account.address,
               contract: contractAddress,
               msg: Buffer.from(JSON.stringify({
                   batch_send: {
                       sends: Array.from({ length: BATCH_SIZE }, (_, i) => ({
                           token_id: (batch * BATCH_SIZE + i).toString(),
                           recipient: RECIPIENT
                       }))
                   }
               })),
               funds: []
           }
       }));

       console.log("Executing batch transaction...");
       const result = await client.signAndBroadcast(account.address, sends, "auto");
       console.log("Tx hash:", result.transactionHash);
   } catch (error) {
       console.error("Error:", error);
   }
}

main();