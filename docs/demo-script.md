# Kelvin demo script — ≤3 minutes

Record at 1920x1080, 30fps, H.264/AAC mp4. Target 30–50 MB final file.

## Opening (0:00 – 0:15)

Title card:

> **Kelvin — a bin-based DLMM deployed as its own Initia appchain.**

Voice-over:

> *Concentrated liquidity lives on Uniswap v3; bin-based DLMMs live on
> Meteora and Trader Joe. All of them are tenants on someone else's chain.
> Kelvin is the first DLMM where the AMM, the chain, and the LP are the
> same thing.*

## Beat 1 — Log in (0:15 – 0:30)

Browser at the Kelvin landing page. Click **Connect** → Google social
login via Privy (InterwovenKit). Paint: wallet pill in the top right
resolves to `alice.init`.

Voice-over:

> *One click Google login — no seed phrase, no browser extension. My
> wallet resolves to its .init handle automatically.*

## Beat 2 — Swap (0:30 – 1:00)

Go to `/swap`. Pick `mETH / mUSDC`. Enter `0.5`. Click **Swap**.
InitScan explorer opens in a second tab showing the tx confirmed.

> *Sub-second finality. A swap on Ethereum takes twelve seconds and a
> two-dollar gas bid; on Kelvin it lands in the next 100-millisecond
> block, paid in micro-INIT.*

## Beat 3 — Enable session (1:00 – 1:15)

Click **Enable session** in the nav. Drawer opens, choose 30 minutes,
approve. Pill turns green: `● Session · 29:58`.

> *One drawer, thirty minutes. I'm now authorizing Kelvin contract
> calls only — no transfers, no staking, no bridges.*

## Beat 4 — Mint a position (1:15 – 1:45)

Go to `/pool/eth-usdc`. Bin chart shows live liquidity. Enter `1 mETH
/ 3000 mUSDC`, half-span `5`, display name `alice.init`. Click
**Add liquidity**.

No popup. The status line flashes through *approve X → approve Y →
mint*. Position appears in the bin chart as a new orange spike around
the active bin.

> *Three transactions, zero popups. The position is bound to
> alice.init on-chain.*

## Beat 5 — Swap shifts the active bin, fees accrue (1:45 – 2:10)

Open a second tab at `/swap`, do a larger swap (`5 mETH`). Switch back
to the pool page — the active-bin marker has jumped left by ~3 bins.

Scroll to the position card. The **pending fees** counter ticks up
live (green flash on each block).

> *At 100 ms blocks, fee accrual is visible in real time. You can
> watch it earn.*

## Beat 6 — Rebalance (2:10 – 2:30)

On the pool page's Rebalance panel, drag the half-span slider to `3`.
Click **Rebalance (no popup)**. Landing status shows the tx hash in
under a second. The bin chart instantly redraws with the narrower
position.

> *This rebalance on Ethereum would require a wallet popup, a gas
> price guess, a twelve-second wait, and about four dollars. On
> Kelvin it's one slider and one block.*

## Beat 7 — Leaderboard (2:30 – 2:50)

Go to `/leaderboard`. `alice.init` is on top with her realized fees.

> *Because the session UX makes per-block rebalancing economical, the
> LPs who do the work get identified. Realized fees, not implied
> yield, named by .init.*

## Close (2:50 – 3:00)

Title card:

> **Kelvin. DLMM on Initia.**
> **kelvin-1 · scan.testnet.initia.xyz/kelvin-1**

---

## Recording notes

- Use `ffmpeg -f x11grab -s 1920x1080 -framerate 30 -i :0.0 -f pulse
  -i default -c:v libx264 -preset veryfast -crf 23 -c:a aac
  -movflags +faststart demo.mp4`
- Or **OBS Studio** with x264, 5 Mbps, 128 kbps audio.
- Cut to length with `ffmpeg -i raw.mp4 -ss 00:00:00 -to 00:03:00
  -c copy demo.mp4`.
- Keep cursor motion deliberate; judges scrub.

## Absolute musts

1. Visible `.init` handle somewhere on every screen it can fit.
2. At least one rebalance transaction must land without a wallet popup,
   and the session pill must be on-screen at that moment.
3. Explorer tab must be shown at least once so the chain ID is verifiable.
