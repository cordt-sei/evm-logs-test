import * as dotenv from "dotenv";
import { createClient } from "./clientSetup.js";
import { MSG_REGISTER_POINTER_TYPE_URL } from "./registry.js";
import * as fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { bech32 } from "bech32";

dotenv.config()

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CONTRACT_PATH = join(__dirname, "../../artifacts/evm_logs_test.wasm");
const RPC_ENDPOINT = "https://rpc.atlantic-2.seinetwork.io/";

const MNEMONIC = process.env.MNEMONIC as string;
if (!MNEMONIC) {
  throw new Error("MNEMONIC is not set in .env");
}

const PREFIX = "sei";
const GAS_PRICE = "0.1usei";
const BATCH_SIZE = 10;
const NUM_BATCHES = 10;
const TOTAL_TOKENS = BATCH_SIZE * NUM_BATCHES;
const RECIPIENT = "sei1wev8ptzj27aueu04wgvvl4gvurax6rj5yrag90";

function seiToEvmAddress(seiAddress: string): string {
    const decoded = bech32.decode(seiAddress);
    const addressBytes = Buffer.from(bech32.fromWords(decoded.words));
    return "0x" + addressBytes.slice(0, 20).toString('hex');
}

async function main() {
    try {
        const { wallet, client } = await createClient(RPC_ENDPOINT, MNEMONIC, PREFIX, GAS_PRICE);
        const [account] = await wallet.getAccounts();
        console.log(`Using account: ${account.address}`);

        console.log("Uploading contract...");
        const wasm = fs.readFileSync(CONTRACT_PATH);
        const { codeId } = await client.upload(account.address, wasm, "auto");
        console.log(`Code ID: ${codeId}`);

        const instantiateMsg = {
            name: "EVM Logs Test",
            symbol: "EVT",
            minter: account.address
        };

        console.log("Instantiating...");
        const { contractAddress } = await client.instantiate(
            account.address,
            codeId,
            instantiateMsg,
            "EVM Logs Test NFT",
            "auto"
        );
        console.log(`Contract: ${contractAddress}`);

        const evmAddress = seiToEvmAddress(contractAddress);
        console.log("Contract address format:", contractAddress);
        console.log("EVM address format:", evmAddress);
        
        const registerPointerMsg = {
            typeUrl: MSG_REGISTER_POINTER_TYPE_URL,
            value: {
                sender: account.address,
                pointer_type: 1,
                erc_address: evmAddress
            }
        };
        
        console.log("Register pointer message:", JSON.stringify(registerPointerMsg, null, 2));

        const pointerResult = await client.signAndBroadcast(
            account.address,
            [registerPointerMsg],
            "auto"
        );
        console.log("Pointer registration tx hash:", pointerResult.transactionHash);

        let pointerAddress = "";
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