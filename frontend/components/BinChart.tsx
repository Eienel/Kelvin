"use client";

import { useReadContract, useReadContracts } from "wagmi";
import { lbPairAbi } from "@/lib/abi";
import { type Address, formatUnits } from "viem";

/**
 * Vertical-bar chart of per-bin liquidity around the active bin.
 * Bars above active = reserveX (base token), below = reserveY (quote).
 * The active bin is highlighted and labeled.
 *
 * Pure SVG; no chart library — keeps the client bundle tiny and lets
 * us animate fee accrual (bar height growth) smoothly under 100ms blocks.
 */
export function BinChart({
  pair,
  span = 30,
  baseDecimals = 18,
  quoteDecimals = 6,
}: {
  pair: Address;
  span?: number;
  baseDecimals?: number;
  quoteDecimals?: number;
}) {
  const { data: active } = useReadContract({
    address: pair,
    abi: lbPairAbi,
    functionName: "getActiveId",
    query: { refetchInterval: 1_500 },
  });

  const activeId = Number(active ?? 0);
  const ids: number[] = [];
  if (activeId > 0) {
    for (let i = -span; i <= span; i++) ids.push(activeId + i);
  }

  const { data: bins } = useReadContracts({
    contracts: ids.map((id) => ({
      address: pair,
      abi: lbPairAbi,
      functionName: "getBin",
      args: [id],
    })),
    query: { refetchInterval: 1_500, enabled: ids.length > 0 },
  });

  if (!activeId || !bins) {
    return (
      <div className="h-48 rounded border border-border bg-panel grid place-items-center text-muted text-sm">
        loading bins…
      </div>
    );
  }

  // Normalize to max for bar scaling.
  let max = 0;
  const data = bins.map((b: any, i) => {
    const [rx = 0n, ry = 0n] = (b?.result ?? [0n, 0n]) as [bigint, bigint];
    const rxF = Number(formatUnits(rx, baseDecimals));
    const ryF = Number(formatUnits(ry, quoteDecimals));
    const total = rxF + ryF;
    if (total > max) max = total;
    return { id: ids[i], rxF, ryF };
  });

  const W = 700;
  const H = 180;
  const bw = Math.max(2, Math.floor(W / data.length) - 1);

  return (
    <div className="rounded border border-border bg-panel p-4">
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-sm text-muted">
          Active bin <span className="text-fg">{activeId}</span>
        </div>
        <div className="text-xs text-muted">
          ± {span} bins · live
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-48">
        {data.map((d, i) => {
          const isActive = d.id === activeId;
          const h = max === 0 ? 0 : ((d.rxF + d.ryF) / max) * (H - 30);
          const x = i * (bw + 1);
          const y = H - h - 10;
          const color = isActive ? "#ff4d00" : d.rxF > d.ryF ? "#38bdf8" : "#a78bfa";
          return (
            <g key={d.id}>
              <rect x={x} y={y} width={bw} height={h} fill={color} opacity={0.85} />
              {isActive && (
                <line
                  x1={x + bw / 2}
                  x2={x + bw / 2}
                  y1={0}
                  y2={H - 8}
                  stroke="#ff4d00"
                  strokeDasharray="2 2"
                  strokeOpacity={0.5}
                />
              )}
            </g>
          );
        })}
        <line x1={0} x2={W} y1={H - 10} y2={H - 10} stroke="#1f1f23" />
      </svg>
      <div className="mt-2 flex gap-4 text-xs text-muted">
        <span>
          <span className="inline-block w-2 h-2 align-middle mr-1 bg-[#38bdf8]" />
          base-heavy
        </span>
        <span>
          <span className="inline-block w-2 h-2 align-middle mr-1 bg-[#a78bfa]" />
          quote-heavy
        </span>
        <span>
          <span className="inline-block w-2 h-2 align-middle mr-1 bg-accent" />
          active
        </span>
      </div>
    </div>
  );
}
