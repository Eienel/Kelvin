# Kelvin — DLMM on Initia

> Concentrated liquidity lives on Uniswap v3; bin-based DLMMs live on
> Meteora and Trader Joe. They share one ceiling: they're tenants on
> someone else's chain. Kelvin is a bin-based DLMM deployed as its own
> Initia appchain — LPs earn swap fees, the chain earns block fees, and
> the two compose through Initia's Interwoven ecosystem. The first DLMM
> where the AMM, the chain, and the LP are all the same thing.

## Initia Hackathon Submission

- **Track**: DeFi
- **Rollup chain ID**: `kelvin-1` (MiniEVM on `initiation-2` testnet)
- **Explorer**: <https://scan.testnet.initia.xyz/kelvin-1>
- **Faucet**: <https://faucet.testnet.initia.xyz>
- **Deploy tx**: captured at deploy time — see `.initia/submission.json`
- **Demo video**: `./video/demo.mp4` *(final link in `.initia/submission.json`)*

### Initia-native features

1. **Auto-signing / Session UX** — one drawer unlocks 30 minutes of
   popup-free interaction. Add-liquidity / collect-fees / rebalance all
   land without a confirmation. Scoped exclusively to
   `/minievm.evm.v1.MsgCall` on `kelvin-1`. See
   [`frontend/lib/useKelvinTx.ts`](frontend/lib/useKelvinTx.ts) for the
   single chokepoint.
2. **.init Usernames** — every position NFT can be bound to an owner's
   .init handle; the leaderboard ranks by handle rather than hex
   address. See
   [`frontend/components/InitName.tsx`](frontend/components/InitName.tsx)
   and
   [`contracts/evm/src/KelvinPositionManager.sol`](contracts/evm/src/KelvinPositionManager.sol).

**Planned stretch** (Day 4 if time allows): Interwoven Bridge pull-in
for deposits from other Initia rollups.

## What it does

Kelvin is a port of [Trader Joe Liquidity Book v2.1.1][lb] to MiniEVM,
with three additions:

- `KelvinPositionManager` — wraps an LP position in an ERC-721, lets
  positions be named by .init handle, and exposes atomic `collectFees`
  (burn + realize + re-mint) and `rebalance` (burn + re-mint at new
  bins). Session-grant-friendly: everything routes through one contract.
- `KelvinFeeRouter` — receives protocol-fee tokens from LBFactory;
  treasury withdraws at will. This is the appchain operator's revenue.
- `scripts/*` + `weave/*` — one-command deploy and one-command seed for
  a fresh `kelvin-1` rollup.

The Liquidity Book fork lives under
[`contracts/evm/src/lb/`](contracts/evm/src/lb) unmodified — math-only
port, credit explicitly retained.

[lb]: https://github.com/lfj-gg/joe-v2

## Repository layout

```
contracts/evm/          Foundry project
  src/lb/               LB v2.1.1 fork (GPL-3.0)
  src/KelvinPositionManager.sol
  src/KelvinFeeRouter.sol
  src/mocks/            MockERC20, MockWNATIVE
  script/Deploy.s.sol
  test/KelvinFlow.t.sol

frontend/               Next.js 14 + TypeScript + Tailwind
  app/                  pages: /, /swap, /pool/[id], /positions, /leaderboard
  components/           Nav, SessionPill, WalletButton, InitName,
                        BinChart, RebalancePanel, PoolList
  lib/                  contracts.ts, abi.ts, initia.ts,
                        lbMath.ts, useKelvinTx.ts

weave/                  launch.evm.json + launch instructions
scripts/                seed-pools.sh, save-addresses.sh
docs/                   demo-script.md, positioning.md
.initia/submission.json Hackathon submission metadata
video/demo.mp4          ≤3-min demo
```

## Try it

```bash
# 1. Launch the Kelvin rollup
cat weave/README.md        # step-by-step weave init / opinit / relayer

# 2. Deploy the contracts
cd contracts/evm
forge test                 # sanity-check the port (5/5 should pass)
forge script script/Deploy.s.sol:Deploy \
  --rpc-url $KELVIN_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast --legacy --slow

./scripts/save-addresses.sh 48888

# 3. Run the frontend
cd frontend
pnpm install
cp ../.env.example .env.local
# fill NEXT_PUBLIC_* values from the forge broadcast output
pnpm dev
```

Browse to <http://localhost:3000> and:

1. Sign in with Google (Privy ↔ InterwovenKit).
2. Click **Enable session** — 30 minutes, `MsgCall`-only, `kelvin-1`.
3. Swap on any pool. Confirm on InitScan in <1 s.
4. LP into a bin range — enter your `.init` handle as the display name.
5. Rebalance from the position panel. No popup.
6. See yourself on the leaderboard under your `.init` handle.

## Tests

```bash
cd contracts/evm
forge test
```

Covers:

- LBPair deposit/withdraw accounting (roundtrip)
- Swap produces fees that accrue per-bin
- `collectFees` realizes the fees and leaves principal
- `rebalance` moves bins atomically
- Only owner / approved-for can mutate a position

Session-scope enforcement is a Cosmos-SDK tx-dispatch concern (not an
on-chain Solidity invariant), so it's tested manually against the
live rollup via the frontend.

## Halal by design

Kelvin is a commercial product we ship to users. A few product
decisions we made early and will not relax:

- No lending, no perps, no fixed-yield. All returns on Kelvin are LP
  fees realized from providing liquidity — productive service income.
- No prediction markets, no lotteries, no games of chance.
- No rebasing-yield tokens as pool assets.

None of this is visible to judges; it's a product-design constraint,
not a pitch.

## Credits

- **Trader Joe / LFJ** for the Liquidity Book v2.1.1 math (GPL-3.0).
  The `contracts/evm/src/lb/` tree is a direct port with pragma
  adjustments for MiniEVM. See
  <https://github.com/lfj-gg/joe-v2/tree/v2.1.1>.
- **Initia Labs** for `weave`, MiniEVM, and the `@initia/interwovenkit-react`
  SDK that makes session UX possible.

## License

- `contracts/evm/src/lb/` — **GPL-3.0** (retained from upstream).
- Everything else in this repository — **MIT**, unless a file header
  says otherwise.
