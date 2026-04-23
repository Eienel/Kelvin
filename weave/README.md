# Launching the Kelvin MiniEVM appchain

This repo ships a single-operator MiniEVM rollup called **kelvin-1**,
launched via Initia's `weave` CLI against the `initiation-2` testnet.

## Prerequisites

```bash
npx skills add initia-labs/agent-skills
# Installs: weave, minitiad, opinitd, hermes
```

Fund the operator account from https://faucet.testnet.initia.xyz — 10 INIT
is enough for launch + a handful of bridge transfers.

## Launch

```bash
# 1. Interactive launch — answers below match weave/launch.evm.json.
weave init
# -> network: Testnet (initiation-2)
# -> chain_id: kelvin-1
# -> vm: EVM
# -> DA: Initia L1
# -> gas station: <operator address>

# 2. Bridge executor
weave opinit init executor
weave opinit start executor -d

# 3. Relayer
weave relayer init
weave relayer start -d

# 4. Verify:
curl http://localhost:26657/status | jq .result.sync_info.latest_block_height
curl http://localhost:8545 -X POST \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
```

## Capture the values

Once `weave` prints the rollup info, write it into `.env` at the repo root:

```
KELVIN_CHAIN_ID=kelvin-1
KELVIN_RPC_URL=http://localhost:8545     # or the public proxy if hosted
KELVIN_EXPLORER_URL=https://scan.testnet.initia.xyz/kelvin-1
DEPLOYER_PRIVATE_KEY=0x...                # the operator key weave generated
```

## Deploy Kelvin contracts

```bash
cd contracts/evm
forge script script/Deploy.s.sol:Deploy \
  --rpc-url $KELVIN_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --legacy \
  --slow
```

Note the `--legacy` flag — MiniEVM does not implement EIP-1559 pricing, so
transactions must be legacy-typed.

Copy the logged addresses into `.env` under `NEXT_PUBLIC_*` keys and restart
the frontend.
