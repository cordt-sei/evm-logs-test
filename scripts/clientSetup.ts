// scripts/clientSetup.ts

import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { GasPrice, calculateFee } from "@cosmjs/stargate";
import { createRegistry } from "./registry.js";

const FIXED_GAS = 9_750_000;

export async function createClient(
    rpcEndpoint: string,
    mnemonic: string,
    prefix: string,
    gasPriceStr: string
) {
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix });
    const registry = createRegistry();
    const gasPrice = GasPrice.fromString("0.02usei");

    const client = await SigningCosmWasmClient.connectWithSigner(
        rpcEndpoint,
        wallet,
        {
            gasPrice,
            registry
        }
    );

    // Override the client's fee calculation for consistent gas
    const originalSignAndBroadcast = client.signAndBroadcast.bind(client);
    client.signAndBroadcast = async (signerAddress, messages, fee) => {
        return originalSignAndBroadcast(
            signerAddress,
            messages,
            calculateFee(FIXED_GAS, gasPrice)
        );
    };

    return { wallet, client };
}