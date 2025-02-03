// scripts/test.ts
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { DirectSecp256k1HdWallet, Registry } from "@cosmjs/proto-signing";
import { GasPrice, defaultRegistryTypes } from "@cosmjs/stargate";
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { registerPointerEncoding, storeCodeEncoding, instantiateContractEncoding, executeContractEncoding } from './proto_encoder.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CONTRACT_PATH = join(dirname(dirname(__filename)), "../artifacts/evm_logs_test.wasm");
const NUM_COLLECTIONS = 3;
const TOKENS_PER_COLLECTION = 100;
const SINGLE_MSG_TOKENS = 50;
const MULTI_MSG_TOKENS = 30;
const RECIPIENT = "sei14v72v7hgzuvgck6v6jsgjacxnt6kdmhm3hv6de";
const RPC_ENDPOINT = "https://rpc.atlantic-2.seinetwork.io/";
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function main() {
    try {
        const wallet = await DirectSecp256k1HdWallet.fromMnemonic("tired zebra install glow own jeans unit shove diary brass super hover", { prefix: "sei" });
        const [account] = await wallet.getAccounts();
        console.log(`Using account: ${account.address}`);
        const registry = new Registry([
            ...defaultRegistryTypes,
            ["/seiprotocol.seichain.evm.MsgRegisterPointer", registerPointerEncoding],
            ["/cosmwasm.wasm.v1.MsgStoreCode", storeCodeEncoding],
            ["/cosmwasm.wasm.v1.MsgInstantiateContract", instantiateContractEncoding],
            ["/cosmwasm.wasm.v1.MsgExecuteContract", executeContractEncoding]
        ]);
        const client = await SigningCosmWasmClient.connectWithSigner(RPC_ENDPOINT, wallet, {
            gasPrice: GasPrice.fromString("0.1usei"),
            registry
        });
        const collections = [];
        for (let i = 0; i < NUM_COLLECTIONS; i++) {
            console.log(`Deploying collection ${i + 1}/${NUM_COLLECTIONS}`);
            const wasm = fs.readFileSync(CONTRACT_PATH);
            console.log("Uploading contract...");
            const uploadResult = await client.upload(account.address, wasm, "auto");
            console.log("Upload result:", uploadResult);
            if (!uploadResult.codeId) {
                throw new Error("No code ID received from upload");
            }
            console.log(`Contract uploaded with code ID: ${uploadResult.codeId}`);
            const instantiateMsg = {
                name: `Collection ${i}`,
                symbol: `COL${i}`,
                minter: account.address
            };
            // After your instantiateMsg definition and before simulate
            console.log("Proto fields:");
            console.log("- sender:", account.address);
            console.log("- codeId:", uploadResult.codeId, "type:", typeof uploadResult.codeId);
            console.log("- label:", `Collection ${i}`);
            console.log("- msg (hex):", Buffer.from(JSON.stringify(instantiateMsg)).toString('hex'));
            const encodedProto = instantiateContractEncoding.encode({
                sender: account.address,
                codeId: uploadResult.codeId,
                label: `Collection ${i}`,
                msg: Buffer.from(JSON.stringify(instantiateMsg)),
                funds: []
            }).finish();
            console.log("Encoded proto (hex):", Buffer.from(encodedProto).toString('hex'));
            // Estimate gas for instantiation
            const simulatedGas = await client.simulate(account.address, [
                {
                    typeUrl: "/cosmwasm.wasm.v1.MsgInstantiateContract",
                    value: {
                        sender: account.address,
                        codeId: uploadResult.codeId,
                        label: `Collection ${i}`,
                        msg: Buffer.from(JSON.stringify(instantiateMsg)),
                        funds: []
                    }
                }
            ], "");
            const fee = {
                amount: [{ denom: "usei", amount: "1000" }],
                gas: Math.ceil(simulatedGas * 1.3).toString()
            };
            console.log("Code ID type:", typeof uploadResult.codeId);
            console.log("Code ID value:", uploadResult.codeId);
            console.log("Instantiate message:", {
                sender: account.address,
                codeId: uploadResult.codeId,
                label: `Collection ${i}`,
                msg: instantiateMsg,
                funds: []
            });
            const encodedMsg = Buffer.from(JSON.stringify(instantiateMsg));
            console.log("Encoded message buffer:", encodedMsg);
            const protoMsg = {
                sender: account.address,
                codeId: uploadResult.codeId,
                label: `Collection ${i}`,
                msg: encodedMsg,
                funds: []
            };
            console.log("Proto message:", instantiateContractEncoding.encode(protoMsg).finish());
            const { contractAddress: nftAddress } = await client.instantiate(account.address, uploadResult.codeId, encodedMsg, `Collection ${i}`, fee);
            const registerMsg = {
                typeUrl: "/seiprotocol.seichain.evm.MsgRegisterPointer",
                value: {
                    sender: account.address,
                    pointer_type: 4,
                    erc_address: nftAddress
                }
            };
            const registerResult = await client.signAndBroadcast(account.address, [registerMsg], "auto");
            let pointerAddress = '';
            for (const event of registerResult.events) {
                for (const attr of event.attributes) {
                    if (attr.key === "pointer_address") {
                        pointerAddress = attr.value;
                        break;
                    }
                }
                if (pointerAddress)
                    break;
            }
            if (!pointerAddress)
                throw new Error("Pointer address not found in events");
            collections.push({ nftAddress, pointerAddress, tokens: [] });
            console.log(`Collection ${i} - NFT: ${nftAddress}, Pointer: ${pointerAddress}`);
            await sleep(2000);
        }
        for (const [idx, collection] of collections.entries()) {
            console.log(`Minting collection ${idx}`);
            for (let i = 0; i < TOKENS_PER_COLLECTION; i++) {
                await client.execute(account.address, collection.nftAddress, { mint: { token_id: i.toString(), owner: account.address } }, "auto");
                collection.tokens.push(i.toString());
                if (i % 10 === 0) {
                    console.log(`Minted ${i} tokens`);
                    await sleep(2000);
                }
            }
        }
        console.log("\nTesting transfer patterns...");
        console.log("Pattern 1: Many tokens in one message");
        const batchMsg = {
            batch_send: {
                sends: collections[0].tokens
                    .slice(0, SINGLE_MSG_TOKENS)
                    .map(tokenId => ({
                    token_id: tokenId,
                    recipient: RECIPIENT
                }))
            }
        };
        const result1 = await client.execute(account.address, collections[0].nftAddress, batchMsg, "auto");
        console.log("Pattern 1 tx:", result1.transactionHash);
        await sleep(2000);
        console.log("Pattern 2: Multiple messages in one tx");
        const messages = collections[1].tokens
            .slice(0, MULTI_MSG_TOKENS)
            .map(tokenId => ({
            typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
            value: {
                sender: account.address,
                contract: collections[1].nftAddress,
                msg: Buffer.from(JSON.stringify({
                    batch_send: {
                        sends: [{ token_id: tokenId, recipient: RECIPIENT }]
                    }
                })),
                funds: []
            }
        }));
        const result2 = await client.signAndBroadcast(account.address, messages, "auto");
        console.log("Pattern 2 tx:", result2.transactionHash);
    }
    catch (error) {
        console.error("Error:", error);
    }
}
main();
