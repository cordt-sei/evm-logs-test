import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { GasPrice } from "@cosmjs/stargate";
import * as fs from 'fs';
import * as path from 'path';

const RPC_ENDPOINT = "https://rpc.atlantic-2.seinetwork.io/";
const CONTRACT_PATH = "../artifacts/evm_logs_test.wasm";

// Configuration
const BATCH_SIZE = 10;  // Number of tokens per batch send message
const NUM_BATCHES = 10; // Number of batch messages per transaction
const TOTAL_TOKENS = BATCH_SIZE * NUM_BATCHES;

async function main() {
    try {
        // Set up wallet with your mnemonic
        const wallet = await DirectSecp256k1HdWallet.fromMnemonic(
            "your mnemonic here",
            {
                prefix: "sei"
            }
        );
        const [account] = await wallet.getAccounts();
        
        console.log(`Using account: ${account.address}`);

        const client = await SigningCosmWasmClient.connectWithSigner(
            RPC_ENDPOINT,
            wallet,
            {
                gasPrice: GasPrice.fromString("0.1usei")
            }
        );

        // Upload contract
        console.log("Uploading contract...");
        const wasmPath = path.join(__dirname, CONTRACT_PATH);
        const wasm = fs.readFileSync(wasmPath);
        const uploadResult = await client.upload(account.address, wasm, "auto");
        console.log(`Contract uploaded with code ID: ${uploadResult.codeId}`);

        // Instantiate
        console.log("Instantiating contract...");
        const instantiateMsg = {
            name: "EVM Logs Test",
            symbol: "EVT",
            minter: account.address
        };

        const { contractAddress } = await client.instantiate(
            account.address,
            uploadResult.codeId,
            instantiateMsg,
            "EVM Logs Test NFT",
            "auto"
        );
        console.log(`Contract instantiated at: ${contractAddress}`);

        // Mint tokens
        console.log(`Minting ${TOTAL_TOKENS} tokens...`);
        for (let i = 0; i < TOTAL_TOKENS; i++) {
            const mintMsg = {
                mint: {
                    token_id: i.toString(),
                    owner: account.address
                }
            };
            await client.execute(account.address, contractAddress, mintMsg, "auto");
            if (i % 10 === 0) {
                console.log(`Minted ${i} tokens...`);
            }
        }

        // Prepare batch messages
        console.log("Preparing batch messages...");
        const messages = [];

        for (let batch = 0; batch < NUM_BATCHES; batch++) {
            const sends = [];
            const startToken = batch * BATCH_SIZE;
            
            for (let i = 0; i < BATCH_SIZE; i++) {
                sends.push({
                    token_id: (startToken + i).toString(),
                    recipient: "sei14v72v7hgzuvgck6v6jsgjacxnt6kdmhm3hv6de" // Update this with your recipient
                });
            }

            messages.push({
                execute: {
                    contract_addr: contractAddress,
                    msg: {
                        batch_send: {
                            sends
                        }
                    },
                    funds: []
                }
            });
        }

        // Execute batched transaction
        console.log("Executing batched transaction...");
        const result = await client.signAndBroadcast(
            account.address,
            messages,
            "auto"
        );
        
        console.log("Transaction successful!");
        console.log("Transaction hash:", result.transactionHash);
        
    } catch (error) {
        console.error("Error:", error);
    }
}

main();