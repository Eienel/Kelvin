"use client";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useReadContract } from "wagmi";
import { parseUnits } from "viem";
import { pools, addresses } from "@/lib/contracts";
import { erc20Abi, lbPairAbi, positionManagerAbi } from "@/lib/abi";
import { BinChart } from "@/components/BinChart";
import { RebalancePanel } from "@/components/RebalancePanel";
import { useKelvinTx } from "@/lib/useKelvinTx";
import { useInterwovenKit } from "@initia/interwovenkit-react";
import { buildSpotConfigs } from "@/lib/lbMath";

export default function PoolPage() {
  const params = useParams<{ id: string }>();
  const pool = pools.find((p) => p.id === params.id);
  const kit = useInterwovenKit() as any;
  const address: string | undefined = kit?.address;

  const [amtX, setAmtX] = useState("1");
  const [amtY, setAmtY] = useState("3000");
  const [span, setSpan] = useState(5);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { send } = useKelvinTx();

  const { data: activeIdRaw } = useReadContract({
    address: pool?.pair,
    abi: lbPairAbi,
    functionName: "getActiveId",
    query: { enabled: !!pool, refetchInterval: 1_500 },
  });

  // User's latest tokenId on this pair — picks the last-minted one.
  const { data: balRaw } = useReadContract({
    address: addresses.positionManager,
    abi: positionManagerAbi,
    functionName: "balanceOf",
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address, refetchInterval: 2_000 },
  });
  const myCount = Number(balRaw ?? 0n);

  const { data: myLastIdRaw } = useReadContract({
    address: addresses.positionManager,
    abi: positionManagerAbi,
    functionName: "tokenOfOwnerByIndex",
    args: address && myCount > 0 ? [address as `0x${string}`, BigInt(myCount - 1)] : undefined,
    query: { enabled: !!address && myCount > 0 },
  });
  const myTokenId = (myLastIdRaw as bigint | undefined) ?? undefined;

  async function addLiquidity() {
    if (!address || !pool || !activeIdRaw) return;
    setBusy(true);
    try {
      const xWei = parseUnits(amtX || "0", 18);
      const yWei = parseUnits(amtY || "0", 6);
      const configs = buildSpotConfigs(Number(activeIdRaw), span);

      setStatus("Approving tokenX…");
      await send({
        to: pool.tokenX,
        abi: erc20Abi,
        functionName: "approve",
        args: [addresses.positionManager, xWei],
      });
      setStatus("Approving tokenY…");
      await send({
        to: pool.tokenY,
        abi: erc20Abi,
        functionName: "approve",
        args: [addresses.positionManager, yWei],
      });
      setStatus("Minting position…");
      const res = await send({
        to: addresses.positionManager,
        abi: positionManagerAbi,
        functionName: "mintPosition",
        args: [
          pool.pair,
          xWei,
          yWei,
          configs,
          address as `0x${string}`,
          name,
        ],
      });
      setStatus(`Minted · tx ${res?.transactionHash?.slice(0, 10) ?? "ok"}…`);
    } catch (e: any) {
      setStatus("Failed: " + (e?.shortMessage ?? e?.message ?? "unknown"));
    } finally {
      setBusy(false);
    }
  }

  if (!pool) return <p className="text-muted">Unknown pool.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">{pool.name}</h1>
        <span className="text-xs text-muted">{pool.binStep / 100}% bin · {Number(activeIdRaw ?? 0)}</span>
      </div>

      <BinChart pair={pool.pair} />

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded border border-border bg-panel p-4 space-y-3">
          <h3 className="font-semibold">Add liquidity</h3>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-muted">
              {pool.base}
              <input
                type="number"
                value={amtX}
                onChange={(e) => setAmtX(e.target.value)}
                className="w-full bg-bg border border-border rounded p-2 text-sm mt-1"
                step="any"
              />
            </label>
            <label className="text-xs text-muted">
              {pool.quote}
              <input
                type="number"
                value={amtY}
                onChange={(e) => setAmtY(e.target.value)}
                className="w-full bg-bg border border-border rounded p-2 text-sm mt-1"
                step="any"
              />
            </label>
          </div>
          <div>
            <div className="flex justify-between text-xs text-muted">
              <span>half-span</span>
              <span>{span} bins</span>
            </div>
            <input
              type="range"
              min={1}
              max={30}
              value={span}
              onChange={(e) => setSpan(parseInt(e.target.value, 10))}
              className="w-full accent-accent"
            />
          </div>
          <label className="text-xs text-muted block">
            display name (your .init handle)
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="alice.init"
              className="w-full bg-bg border border-border rounded p-2 text-sm mt-1"
            />
          </label>
          <button
            onClick={addLiquidity}
            disabled={busy || !address}
            className="w-full bg-accent text-black font-semibold py-2 rounded hover:opacity-90 disabled:opacity-40"
          >
            {busy ? "Working…" : address ? "Add liquidity" : "Connect to LP"}
          </button>
          {status && (
            <p className="text-xs text-muted tick rounded px-2 py-1">{status}</p>
          )}
        </div>

        {myTokenId != null ? (
          <RebalancePanel tokenId={myTokenId} pair={pool.pair} />
        ) : (
          <div className="rounded border border-border bg-panel p-4 text-sm text-muted">
            Mint a position above to unlock the rebalance panel.
          </div>
        )}
      </div>
    </div>
  );
}
