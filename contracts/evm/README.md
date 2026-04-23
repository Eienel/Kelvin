# Kelvin contracts (MiniEVM)

## Setup

`lib/` is gitignored. Bootstrap the Foundry deps once per clone:

```bash
cd contracts/evm
forge install --no-git foundry-rs/forge-std
forge install --no-git OpenZeppelin/openzeppelin-contracts@v4.9.6
forge build
forge test
```

Expected: **5/5 passing** in `KelvinFlow.t.sol`.

## Layout

- `src/lb/` — **GPL-3.0 fork** of Trader Joe Liquidity Book v2.1.1
  (<https://github.com/lfj-gg/joe-v2>). Math only; no upstream changes
  beyond pragma relaxation (`0.8.10` → `^0.8.10`) so the project can
  build under a newer solc for tests/scripts.
- `src/KelvinPositionManager.sol` — ERC-721 wrapper for LP positions;
  atomic `collectFees` and `rebalance`; `.init` display-name slot.
- `src/KelvinFeeRouter.sol` — protocol-fee sink / treasury withdraw.
- `src/mocks/` — test tokens + mock WNATIVE for router construction.
- `script/Deploy.s.sol` — one-shot deploy of factory, preset, pairs,
  router, quoter, PositionManager + mock tokens with initial supply.
- `test/KelvinFlow.t.sol` — end-to-end flow: mint / swap / collect /
  rebalance / transfer / auth.

## Compiler pinning

- `solc = 0.8.20`
- `evm_version = paris` — no PUSH0/MCOPY/TLOAD in output. MiniEVM
  supports Cancun + Prague, but Paris output is a defensive default
  that also runs on chains that haven't updated.
- `optimizer = true, runs = 800` — matches upstream LB settings.

## Broadcast

```bash
forge script script/Deploy.s.sol:Deploy \
  --rpc-url $KELVIN_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast --legacy --slow
```

`--legacy` is required on MiniEVM (no EIP-1559).
