"use client";
import { useState } from "react";
import { useReadContract } from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { pools, addresses } from "@/lib/contracts";
import { erc20Abi, lbPairAbi } from "@/lib/abi";
import { useKelvinTx } from "@/lib/useKelvinTx";
import { useInterwovenKit } from "@initia/interwovenkit-react";

export default function SwapPage() {
  const [poolIdx, setPoolIdx] = useState(0);
  const [swapForY, setSwapForY] = useState(true);
  const [amount, setAmount] = useState("1");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { send } = useKelvinTx();
  const kit = useInterwovenKit() as any;
  const address: string | undefined = kit?.address;

  const pool = pools[poolIdx];
  const tokenIn = swapForY ? pool.tokenX : pool.tokenY;
  const tokenOut = swapForY ? pool.tokenY : pool.tokenX;

  async function doSwap() {
    if (!address) return;
    setBusy(true);
    setStatus("Encoding swap…");
    try {
      // Parse amount — we assume 18 decimals for base, 6 for quote.
      const dec = swapForY ? 18 : 6;
      const amt = parseUnits(amount || "0", dec);

      // 1) transfer tokenIn to pair (LB's mint/swap pattern pre-funds the pair)
      setStatus("Funding pair…");
      await send({
        to: tokenIn,
        abi: erc20Abi,
        functionName: "transfer",
        args: [pool.pair, amt],
      } as any);

      // 2) call swap(swapForY, to)
      setStatus("Swapping…");
      const res = await send({
        to: pool.pair,
        abi: lbPairAbi,
        functionName: "swap",
        args: [swapForY, address as `0x${string}`],
      });
      setStatus(`Swap landed · tx ${res?.transactionHash?.slice(0, 10) ?? "ok"}…`);
    } catch (e: any) {
      setStatus("Failed: " + (e?.shortMessage ?? e?.message ?? "unknown"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Swap</h1>

      <div className="rounded border border-border bg-panel p-4 space-y-3">
        <select
          value={poolIdx}
          onChange={(e) => setPoolIdx(parseInt(e.target.value, 10))}
          className="w-full bg-bg border border-border rounded p-2 text-sm"
        >
          {pools.map((p, i) => (
            <option key={p.id} value={i}>
              {p.name}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 bg-bg border border-border rounded p-2 text-sm"
            min={0}
            step="any"
          />
          <button
            onClick={() => setSwapForY(!swapForY)}
            className="bg-bg border border-border rounded px-3 py-2 text-sm hover:border-accent"
            title="Flip direction"
          >
            {swapForY ? `${pool.base} → ${pool.quote}` : `${pool.quote} → ${pool.base}`}
          </button>
        </div>

        <button
          onClick={doSwap}
          disabled={busy || !address}
          className="w-full bg-accent text-black font-semibold py-2 rounded hover:opacity-90 disabled:opacity-40"
        >
          {busy ? "Working…" : address ? "Swap" : "Connect to swap"}
        </button>

        {status && (
          <p className="text-xs text-muted tick rounded px-2 py-1">{status}</p>
        )}
      </div>

      <p className="text-xs text-muted text-center">
        Kelvin routes swaps directly through LBPair. No router hop, no slippage
        check — this is a demo UI. Production would quote through LBRouter.
      </p>
    </div>
  );
}
