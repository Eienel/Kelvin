"use client";
import Link from "next/link";
import { useReadContract, useReadContracts } from "wagmi";
import { pools } from "@/lib/contracts";
import { lbPairAbi } from "@/lib/abi";
import { formatUnits } from "viem";
import { priceFromBinId } from "@/lib/lbMath";

export function PoolList() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {pools.map((p) => (
        <PoolCard key={p.id} pool={p} />
      ))}
    </div>
  );
}

function PoolCard({ pool }: { pool: (typeof pools)[number] }) {
  const { data: active } = useReadContract({
    address: pool.pair,
    abi: lbPairAbi,
    functionName: "getActiveId",
    query: { refetchInterval: 1_500 },
  });
  const { data: reserves } = useReadContract({
    address: pool.pair,
    abi: lbPairAbi,
    functionName: "getReserves",
    query: { refetchInterval: 1_500 },
  });
  const [rx, ry] = (reserves ?? [0n, 0n]) as [bigint, bigint];
  const price = active ? priceFromBinId(Number(active), pool.binStep) : 0;

  return (
    <Link
      href={`/pool/${pool.id}`}
      className="block rounded border border-border bg-panel p-4 hover:border-accent"
    >
      <div className="flex items-baseline justify-between">
        <div className="font-semibold">{pool.name}</div>
        <span className="text-xs text-muted">{pool.binStep / 100}% bin</span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
        <div>
          <div className="text-muted text-xs">price</div>
          <div>{price ? price.toFixed(price > 100 ? 0 : 4) : "—"}</div>
        </div>
        <div>
          <div className="text-muted text-xs">reserves {pool.base}</div>
          <div>{Number(formatUnits(rx, 18)).toFixed(2)}</div>
        </div>
        <div>
          <div className="text-muted text-xs">reserves {pool.quote}</div>
          <div>{Number(formatUnits(ry, 6)).toFixed(0)}</div>
        </div>
      </div>
    </Link>
  );
}
