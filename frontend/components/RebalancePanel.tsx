"use client";

import { useState } from "react";
import { useReadContract } from "wagmi";
import type { Address } from "viem";
import { addresses } from "@/lib/contracts";
import { lbPairAbi, positionManagerAbi } from "@/lib/abi";
import { buildSpotConfigs } from "@/lib/lbMath";
import { useKelvinTx } from "@/lib/useKelvinTx";

/**
 * One-click rebalance: pick a new half-span around the current active bin,
 * hit "Rebalance", watch it land sub-second with no popup when a session
 * is active. This is the hero demo moment.
 */
export function RebalancePanel({
  tokenId,
  pair,
}: {
  tokenId: bigint;
  pair: Address;
}) {
  const [halfSpan, setHalfSpan] = useState(5);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const { send, sessionActive } = useKelvinTx();

  const { data: activeIdRaw } = useReadContract({
    address: pair,
    abi: lbPairAbi,
    functionName: "getActiveId",
    query: { refetchInterval: 1_500 },
  });

  async function run() {
    if (!activeIdRaw) return;
    setBusy(true);
    setStatus("Encoding configs…");
    const configs = buildSpotConfigs(Number(activeIdRaw), halfSpan);
    try {
      setStatus(
        sessionActive
          ? "Submitting (no popup — session active)…"
          : "Opening confirmation drawer…"
      );
      const res = await send({
        to: addresses.positionManager,
        abi: positionManagerAbi,
        functionName: "rebalance",
        args: [tokenId, configs],
      });
      setStatus(`Rebalanced · tx ${res?.transactionHash?.slice(0, 10) ?? "ok"}…`);
    } catch (e: any) {
      setStatus("Failed: " + (e?.shortMessage ?? e?.message ?? "unknown"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded border border-border bg-panel p-4 space-y-3">
      <div className="flex items-baseline justify-between">
        <h3 className="font-semibold">Rebalance</h3>
        <span className="text-xs text-muted">position #{tokenId.toString()}</span>
      </div>
      <div>
        <div className="flex items-baseline justify-between text-sm">
          <label className="text-muted">Half-span</label>
          <span className="text-fg">{halfSpan} bins</span>
        </div>
        <input
          type="range"
          min={1}
          max={50}
          value={halfSpan}
          onChange={(e) => setHalfSpan(parseInt(e.target.value, 10))}
          className="w-full accent-accent"
        />
      </div>
      <button
        onClick={run}
        disabled={busy}
        className="w-full bg-accent text-black font-semibold py-2 rounded hover:opacity-90 disabled:opacity-40"
      >
        {busy ? "Working…" : sessionActive ? "Rebalance (no popup)" : "Rebalance"}
      </button>
      {status && <p className="text-xs text-muted tick rounded px-2 py-1">{status}</p>}
      {!sessionActive && (
        <p className="text-xs text-muted">
          Tip: enable a session (top-right) to skip the drawer on each rebalance.
        </p>
      )}
    </div>
  );
}
