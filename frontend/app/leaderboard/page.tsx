"use client";
import { useReadContract, useReadContracts } from "wagmi";
import { addresses } from "@/lib/contracts";
import { positionManagerAbi } from "@/lib/abi";
import { InitName } from "@/components/InitName";
import { formatUnits, type Address } from "viem";
import { shortAddr } from "@/lib/format";

/**
 * Leaderboard ranks positions by total realized fees (X + Y combined, naive).
 * Reads the top N tokenIds linearly — fine for a hackathon-scale demo.
 * A production version would back this with an events indexer (viem
 * watchEvent → sqlite) for O(1) pagination and cross-token valuation.
 */
export default function LeaderboardPage() {
  // PositionManager uses an incrementing _nextId starting at 1; we can read
  // recent positions by enumerating 1..N. We sample the last 30 positions
  // (hackathon scale); replace with events when the table grows.
  const SAMPLE = 30;
  const ids = Array.from({ length: SAMPLE }, (_, i) => BigInt(i + 1));

  const { data: positions } = useReadContracts({
    contracts: ids.map((id) => ({
      address: addresses.positionManager,
      abi: positionManagerAbi,
      functionName: "getPosition",
      args: [id],
    })),
    query: { refetchInterval: 3_000 },
  });
  const { data: owners } = useReadContracts({
    contracts: ids.map((id) => ({
      address: addresses.positionManager,
      abi: positionManagerAbi,
      functionName: "ownerOf",
      args: [id],
    })),
  });
  const { data: names } = useReadContracts({
    contracts: ids.map((id) => ({
      address: addresses.positionManager,
      abi: positionManagerAbi,
      functionName: "initName",
      args: [id],
    })),
  });

  const rows: Array<{
    id: bigint;
    owner: Address;
    name: string;
    feesX: bigint;
    feesY: bigint;
    score: number;
  }> = [];

  for (let i = 0; i < ids.length; i++) {
    const p: any = positions?.[i]?.result;
    const owner = owners?.[i]?.result as Address | undefined;
    const name = (names?.[i]?.result as string | undefined) ?? "";
    if (!p || !owner) continue;
    const feesX = (p.feesCollectedX ?? 0n) as bigint;
    const feesY = (p.feesCollectedY ?? 0n) as bigint;
    // Naive score: scale by decimals and sum. Real UI would price-convert.
    const score =
      Number(formatUnits(feesX, 18)) + Number(formatUnits(feesY, 6));
    if (score === 0) continue;
    rows.push({ id: ids[i], owner, name, feesX, feesY, score });
  }
  rows.sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Leaderboard</h1>
      <p className="text-sm text-muted max-w-2xl">
        Top LPs by realized fees on Kelvin. Fees here are productive income —
        swap fees realized at{" "}
        <span className="text-accent">collect</span> time — not implied or
        rebasing yield.
      </p>

      <div className="rounded border border-border bg-panel divide-y divide-border">
        {rows.length === 0 && (
          <div className="p-6 text-center text-muted text-sm">
            No realized fees yet. Execute a swap to start the flywheel.
          </div>
        )}
        {rows.map((r, idx) => (
          <div
            key={r.id.toString()}
            className="flex items-center gap-4 p-3 text-sm"
          >
            <div className="w-6 text-right text-muted">{idx + 1}</div>
            <div className="flex-1">
              <div className="font-semibold">
                {r.name ? (
                  <span className="text-accent">{r.name}</span>
                ) : (
                  <InitName address={r.owner} fallback={shortAddr(r.owner)} />
                )}
              </div>
              <div className="text-xs text-muted">position #{r.id.toString()}</div>
            </div>
            <div className="text-right">
              <div>
                {Number(formatUnits(r.feesX, 18)).toLocaleString(undefined, {
                  maximumFractionDigits: 4,
                })}{" "}
                X
              </div>
              <div className="text-xs text-muted">
                {Number(formatUnits(r.feesY, 6)).toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}{" "}
                Y
              </div>
            </div>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                `I just earned ${r.score.toFixed(2)} in realized fees on @KelvinDLMM — a bin-based DLMM on Initia. Come LP with me: kelvin.fi`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-muted hover:text-accent"
              title="Share to X"
            >
              ↗ share
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
