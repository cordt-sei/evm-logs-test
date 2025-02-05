import * as dotenv from "dotenv";
import { createClient } from "./clientSetup.js";
import * as fs from "fs";
import { fileURLToPath } from "url";
import * as path from "path";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { StdFee } from "@cosmjs/stargate";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FACTORY_PATH = path.join(__dirname, "..", "..", "artifacts", "evm_logs_test.wasm");
const CW721_PATH = path.join(__dirname, "..", "..", "artifacts", "cw721_base.wasm");
const RPC_ENDPOINT = "https://rpc.atlantic-2.seinetwork.io/";

dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

const MNEMONIC = process.env.MNEMONIC ?? (() => {
  throw new Error("MNEMONIC is not set in .env");
})();

const PREFIX = "sei";
const GAS_PRICE = "0.02usei";  // Changed to match clientSetup.ts
const COLLECTIONS_COUNT = 2;
const BATCH_SIZE = 5;
const TOKENS_PER_COLLECTION = 10;
const RECIPIENT = "sei1wev8ptzj27aueu04wgvvl4gvurax6rj5yrag90";

const FIXED_GAS = {
  UPLOAD: 2_000_000,
  INSTANTIATE: 500_000,
  EXECUTE: 300_000,
  BATCH: 1_000_000
};

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function verifyFile(path: string, desc: string) {
  try {
    await fs.promises.access(path, fs.constants.R_OK);
    console.log(`Found ${desc} at ${path}`);
  } catch (e) {
    throw new Error(`Cannot access ${desc} at ${path}. Error: ${e}`);
  }
}

async function main() {
  try {
    // Verify files exist before proceeding
    await verifyFile(CW721_PATH, "CW721 contract");
    await verifyFile(FACTORY_PATH, "Factory contract");

    const { wallet, client } = await createClient(RPC_ENDPOINT, MNEMONIC, PREFIX, GAS_PRICE);
    const [account] = await wallet.getAccounts();
    console.log(`Using account: ${account.address}`);

    // First upload the CW721-base contract
    console.log("\nUploading CW721-base contract...");
    const cw721Wasm = fs.readFileSync(CW721_PATH);
    const { codeId: cw721CodeId } = await client.upload(account.address, cw721Wasm, "auto");
    console.log(`CW721 Code ID: ${cw721CodeId}`);
    await sleep(1500);

    // Upload factory contract
    console.log("\nUploading factory contract...");
    const factoryWasm = fs.readFileSync(FACTORY_PATH);
    const { codeId: factoryCodeId } = await client.upload(account.address, factoryWasm, "auto");
    console.log(`Factory Code ID: ${factoryCodeId}`);
    await sleep(1500);

    // Instantiate factory with CW721 code ID
    console.log("\nInstantiating factory...");
    const instantiateMsg = {
      name: "CW721 Factory",
      symbol: "FACT",
      admin: account.address,
      cw721_code_id: cw721CodeId,
    };

    const { contractAddress: factoryAddress } = await client.instantiate(
      account.address,
      factoryCodeId,
      instantiateMsg,
      "CW721 Factory",
      "auto",
      { admin: account.address }
    );
    console.log(`Factory Contract: ${factoryAddress}`);
    await sleep(1500);

    // Create collections
    const collections = [];
    for (let i = 0; i < COLLECTIONS_COUNT; i++) {
      console.log(`\nCreating collection ${i + 1}/${COLLECTIONS_COUNT}...`);
      const createMsg = {
        create_collection: {
          name: `Collection ${i + 1}`,
          symbol: `COL${i + 1}`,
        }
      };
      
      const result = await client.execute(
        account.address,
        factoryAddress,
        createMsg,
        "auto"
      );

      // Extract collection address from events
      const collectionAddr = result.events
        .find(e => e.type === "wasm")
        ?.attributes
        .find(a => a.key === "_contract_address" || a.key === "collection_address")
        ?.value;

      if (collectionAddr) {
        collections.push(collectionAddr);
        console.log(`Created collection: ${collectionAddr}`);
      } else {
        console.warn("Could not find collection address in events:", result.events);
      }

      await sleep(1500);
    }

    // Query collections
    console.log("\nQuerying collections...");
    const collectionsResponse = await client.queryContractSmart(factoryAddress, {
      collections: {}
    });
    console.log("Collections:", collectionsResponse);

    // Mint tokens for each collection in batches
    for (let collectionIndex = 0; collectionIndex < collections.length; collectionIndex++) {
      const collectionAddr = collections[collectionIndex];
      console.log(`\nMinting tokens for collection ${collectionIndex + 1}/${collections.length}`);
      
      for (let i = 0; i < TOKENS_PER_COLLECTION; i += BATCH_SIZE) {
        const batchSize = Math.min(BATCH_SIZE, TOKENS_PER_COLLECTION - i);
        const tokenIds = Array.from({ length: batchSize }, (_, index) => `${collectionIndex}-${i + index}`);
        
        const mintMsg = {
          batch_mint: {
            collection_addr: collectionAddr,
            token_ids: tokenIds,
            owner: account.address
          }
        };

        const result = await client.execute(
          account.address,
          factoryAddress,
          mintMsg,
          "auto"
        );

        console.log(`Minted tokens ${i + 1} to ${i + batchSize}. Tx hash: ${result.transactionHash}`);
        await sleep(1500);
      }
    }

    // Test batch transfers
    console.log("\nExecuting batch transfers...");
    for (const collectionAddr of collections) {
      const transfers = Array.from({ length: BATCH_SIZE }, (_, i) => ({
        collection_addr: collectionAddr,
        token_id: `0-${i}`,
        recipient: RECIPIENT
      }));

      const transferMsg = {
        batch_transfer: { transfers }
      };

      const result = await client.execute(
        account.address,
        factoryAddress,
        transferMsg,
        "auto"
      );

      console.log(`Batch transfer completed. Tx hash: ${result.transactionHash}`);
      await sleep(1500);
    }

    console.log("\nTest completed successfully!");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();