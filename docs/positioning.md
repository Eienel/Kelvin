# Positioning

## One-liner

> Kelvin is a bin-based DLMM deployed as its own Initia appchain.
> Concentrated liquidity with 100 ms block times, popup-free rebalancing
> via auto-signing, and LP positions named by .init handle.

## Comparables

| Protocol          | Chain       | Concentrated? | Block time | Session UX | Own-chain? |
|-------------------|-------------|---------------|------------|------------|------------|
| Uniswap v3        | Ethereum    | yes (ticks)   | 12 s       | no         | no         |
| Uniswap v4        | Ethereum    | yes + hooks   | 12 s       | no         | no         |
| Meteora DLMM      | Solana      | yes (bins)    | 400 ms     | partial    | no         |
| Trader Joe LB     | Avalanche   | yes (bins)    | 1–2 s      | no         | no         |
| **Kelvin DLMM**   | **Initia**  | **yes (bins)** | **100 ms** | **yes**    | **yes**    |

## Why Initia unlocks this

1. **100 ms blocks** make per-block rebalancing economical. On Ethereum
   L1 you wait twelve seconds and pay gas; on Kelvin, rebalancing into
   the current active bin is almost free.
2. **Session UX (auto-signing)** removes the wallet popup on every tx.
   Active LPs can adjust their range continuously instead of once every
   few days.
3. **Own-your-appchain.** Kelvin collects block fees on top of swap
   fees. The operator's revenue compounds with volume; LPs still get
   their pro-rata share of swap fees in the bins.
4. **Interwoven composability.** Other Initia rollups can bridge
   liquidity in from their chains via the Interwoven Bridge; Kelvin
   doesn't fight for attention on a shared L1.

## Stretch narrative — Enshrined Liquidity

Initia L1 rewards INIT-paired LP positions with staking yield and
voting power (Enshrined Liquidity). Kelvin's fee output — the `uinit`
it earns — can be bridged back to L1 and staked into an Enshrined
Liquidity position. An LP on Kelvin optionally compounds into
governance weight on the chain that hosts them. *Not in scope for the
hackathon MVP; narrative hook for the README.*

## What we deliberately did not build

- **Lending, perps, rebasing yield tokens.** All three generate returns
  from debt or random outcomes, not from productive services.
- **Prediction markets, lotteries.** Same reason.
- **Second VM.** We went MiniEVM-only. Depth over breadth.
- **Real-money custody, KYC.** Testnet only.

## Why this wins the rubric

- **Technical Execution & Initia Integration (30%).** Two native
  features in the hero path: auto-signing (rebalance) and .init
  (leaderboard identity). Enshrined Liquidity called out as the
  next step.
- **Originality & Track Fit (20%).** "DLMM-as-an-appchain" hasn't
  shipped anywhere. DeFi track, unambiguously.
- **Product Value & UX (20%).** Sub-second, popup-free LPing is a
  genuinely new experience — measurable against any other chain.
- **Working Demo & Completeness (20%).** Repo + contracts + frontend
  + submission.json + 3-min video.
- **Market Understanding (10%).** README positions explicitly against
  Meteora, Trader Joe, Uniswap v3/v4.
