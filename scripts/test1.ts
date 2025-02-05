// scripts/test.ts

import * as dotenv from "dotenv";
import { createClient } from "./clientSetup.js";
import { MSG_REGISTER_POINTER_TYPE_URL } from "./registry.js";
import * as fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { bech32 } from "bech32";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CONTRACT_PATH = join(__dirname, "../../artifacts/evm_logs_test.wasm");
const RPC_ENDPOINT = "https://rpc.atlantic-2.seinetwork.io/";

dotenv.config({ path: join(__dirname, "../../.env") });

const MNEMONIC = process.env.MNEMONIC ?? (() => {
  throw new Error("MNEMONIC is not set in .env");
})();
const PREFIX = "sei";
const GAS_PRICE = "0.1usei";
const GAS_MULTIPLIER = 1.2; // Add a buffer to estimated gas
const BATCH_SIZE = 10;
const NUM_BATCHES = 10;
const TOTAL_TOKENS = BATCH_SIZE * NUM_BATCHES;
const RECIPIENT = "sei1wev8ptzj27aueu04wgvvl4gvurax6rj5yrag90";

/**
 * Converts a SEI Bech32 address to an Ethereum address format.
 */
function seiToEvmAddress(seiAddress: string) {
  const decoded = bech32.decode(seiAddress);
  const addressBytes = Buffer.from(bech32.fromWords(decoded.words));
  return "0x" + addressBytes.slice(0, 20).toString("hex");
}

/**
 * Simulate and estimate gas before broadcasting a transaction.
 */
async function estimateGas(client: SigningCosmWasmClient, sender: string, messages: { typeUrl: string; value: { sender: string; pointer_type: number; erc_address: string; }; }[] | { typeUrl: string; value: { sender: string; contract: string; msg: Buffer<ArrayBuffer>; funds: never[]; }; }[] | { typeUrl: string; value: { sender: string; wasm_byte_code: Buffer<ArrayBufferLike>; }; }[] | { typeUrl: string; value: { sender: string; code_id: number; msg: { name: string; symbol: string; minter: string; }; funds: never[]; }; }[] | { typeUrl: string; value: { sender: string; contract: string; msg: { mint: { token_id: string; owner: string; }; }; funds: never[]; }; }[]) {
  try {
    const gasUsed = await client.simulate(sender, messages, "");
    const estimatedGas = Math.ceil(gasUsed * GAS_MULTIPLIER);
    console.log(`Estimated Gas: ${estimatedGas}`);
    return estimatedGas;
  } catch (error) {
    console.warn("Gas estimation failed, falling back to auto:", error);
    return "auto"; // Fallback to auto if estimation fails
  }
}

async function main() {
  try {
    const { wallet, client } = await createClient(RPC_ENDPOINT, MNEMONIC, PREFIX, GAS_PRICE);
    const [account] = await wallet.getAccounts();
    console.log(`Using account: ${account.address}`);

    console.log("Uploading contract...");
    const wasm = fs.readFileSync(CONTRACT_PATH);
    const uploadGas = await estimateGas(client, account.address, [{ typeUrl: "/cosmwasm.wasm.v1.MsgStoreCode", value: { sender: account.address, wasm_byte_code: wasm }}]);
    const { codeId } = await client.upload(account.address, wasm, uploadGas);
    console.log(`Code ID: ${codeId}`);

    console.log("Instantiating...");
    const instantiateMsg = {
      name: "EVM Logs Test",
      symbol: "EVT",
      minter: account.address,
    };
    const instantiateGas = await estimateGas(client, account.address, [{ typeUrl: "/cosmwasm.wasm.v1.MsgInstantiateContract", value: { sender: account.address, code_id: codeId, msg: instantiateMsg, funds: [] }}]);
    const { contractAddress } = await client.instantiate(account.address, codeId, instantiateMsg, "EVM Logs Test NFT", instantiateGas);
    console.log(`Contract: ${contractAddress}`);

    const evmAddress = seiToEvmAddress(contractAddress);
    console.log("Contract address format:", contractAddress);
    console.log("EVM address format:", evmAddress);

    console.log("Registering pointer...");
    const registerPointerMsg = {
      typeUrl: MSG_REGISTER_POINTER_TYPE_URL,
      value: {
        sender: account.address,
        pointer_type: 4,
        erc_address: evmAddress,
      },
    };
    const registerGas = await estimateGas(client, account.address, [registerPointerMsg]);
    const pointerResult = await client.signAndBroadcast(account.address, [registerPointerMsg], registerGas);
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
    console.log("Pointer address:", evmAddress);

    console.log(`Minting ${TOTAL_TOKENS} tokens...`);
    for (let i = 0; i < TOTAL_TOKENS; i++) {
      const mintGas = await estimateGas(client, account.address, [
        {
          typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
          value: {
            sender: account.address,
            contract: contractAddress,
            msg: { mint: { token_id: i.toString(), owner: account.address } },
            funds: [],
          },
        },
      ]);
      await client.execute(account.address, contractAddress, { mint: { token_id: i.toString(), owner: account.address } }, mintGas);
      if (i % 10 === 0) console.log(`Minted ${i}`);
    }

    console.log("Executing batch transaction...");
    const sends = Array.from({ length: NUM_BATCHES }, (_, batch) => ({
      typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
      value: {
        sender: account.address,
        contract: contractAddress,
        msg: Buffer.from(
          JSON.stringify({
            batch_send: {
              sends: Array.from({ length: BATCH_SIZE }, (_, i) => ({
                token_id: (batch * BATCH_SIZE + i).toString(),
                recipient: RECIPIENT,
              })),
            },
          })
        ),
        funds: [],
      },
    }));

    const batchGas = await estimateGas(client, account.address, sends);
    const result = await client.signAndBroadcast(account.address, sends, batchGas);
    console.log("Tx hash:", result.transactionHash);
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
