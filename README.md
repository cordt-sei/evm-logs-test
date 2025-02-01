# EVM Logs Test

A CosmWasm smart contract for testing EVM-like logs on Sei Network. This contract implements a simplified CW721 NFT contract with batch send functionality to test event emission patterns.

## Features

- Basic CW721 NFT implementation
- Batch send functionality (multiple NFTs in a single message)
- Support for stacking multiple batch sends in a single transaction

## Building

```bash
# Build wasm
cargo wasm

# Optimize for deployment
docker run --rm -v "$(pwd)":/code \
  --mount type=volume,source="$(basename "$(pwd)")_cache",target=/target \
  --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
  cosmwasm/optimizer:0.16.0
```

## Testing

```bash
# Unit tests
cargo test

# Integration tests (requires Node.js)
cd scripts
npm install
ts-node test.ts
```

## Deployment and Testing

1. First, set up the testing environment:
```bash
# Install dependencies for deployment scripts
cd scripts
npm install @cosmjs/cosmwasm-stargate @cosmjs/proto-signing @cosmjs/stargate
npm install typescript ts-node @types/node --save-dev
```

2. Configure your test wallet:
```typescript
// In scripts/test.ts, update these values:
const MNEMONIC = "your mnemonic here";
const RECIPIENT = "recipient_address_here";  // A test wallet to receive NFTs
```

3. Deploy and test the contract:
```bash
# Run the deployment and test script
ts-node test.ts
```

This will:
- Upload the contract to atlantic-2 testnet
- Instantiate a new instance
- Mint 100 test NFTs
- Execute 10 batch sends (10 NFTs each) in a single transaction

### Manual Testing with sei-cli

You can also test the contract manually using sei-cli:

1. Store the contract:
```bash
sei-cli tx wasm store artifacts/evm_logs_test.wasm \
  --from your_key \
  --chain-id atlantic-2 \
  --node https://rpc.atlantic-2.seinetwork.io/ \
  --gas-prices 0.1usei \
  --gas auto \
  --gas-adjustment 1.3
```

2. Instantiate:
```bash
sei-cli tx wasm instantiate $CODE_ID '{"name":"Test","symbol":"TST","minter":"your_address"}' \
  --from your_key \
  --chain-id atlantic-2 \
  --label "EVM Logs Test" \
  --node https://rpc.atlantic-2.seinetwork.io/ \
  --gas-prices 0.1usei
```

3. Mint an NFT:
```bash
sei-cli tx wasm execute $CONTRACT_ADDRESS \
  '{"mint":{"token_id":"1","owner":"your_address"}}' \
  --from your_key \
  --chain-id atlantic-2 \
  --node https://rpc.atlantic-2.seinetwork.io/ \
  --gas-prices 0.1usei
```

4. Execute a batch send:
```bash
sei-cli tx wasm execute $CONTRACT_ADDRESS \
  '{"batch_send":{"sends":[{"token_id":"1","recipient":"recipient_address"}]}}' \
  --from your_key \
  --chain-id atlantic-2 \
  --node https://rpc.atlantic-2.seinetwork.io/ \
  --gas-prices 0.1usei
```

5. Query token owner:
```bash
sei-cli query wasm contract-state smart $CONTRACT_ADDRESS \
  '{"owner_of":{"token_id":"1"}}' \
  --node https://rpc.atlantic-2.seinetwork.io/
```

## License

MIT