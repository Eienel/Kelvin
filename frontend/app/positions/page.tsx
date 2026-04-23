"use client";
import { useInterwovenKit } from "@initia/interwovenkit-react";
import { useReadContract, useReadContracts } from "wagmi";
import { addresses } from "@/lib/contracts";
import { positionManagerAbi } from "@/lib/abi";
import { InitName } from "@/components/InitName";
import { formatUnits } from "viem";
import { useKelvinTx } from "@/lib/useKelvinTx";
import { useState } from "react";

export default function PositionsPage() {
  const kit = useInterwovenKit() as any;
  const address: string | undefined = kit?.address;

  const { data: balRaw } = useReadContract({
    address: addresses.positionManager,
    abi: positionManagerAbi,
    functionName: "balanceOf",
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address, refetchInterval: 2_000 },
  });
  const count = Number(balRaw ?? 0n);
  const indices = Array.from({ length: count }, (_, i) => i);

  const { data: idsRaw } = useReadContracts({
    contracts: indices.map((i) => ({
      address: addresses.positionManager,
      abi: positionManagerAbi,
      functionName: "tokenOfOwnerByIndex",
      args: [address as `0x${string}`, BigInt(i)],
    })),
    query: { enabled: !!address && count > 0 },
  });
  const tokenIds =
    (idsRaw ?? []).map((r: any) => r?.result as bigint | undefined).filter(Boolean) as bigint[];

  if (!address) return <p className="text-muted">Connect to see your positions.</p>;
  if (count === 0)
    return <p className="text-muted">No positions yet — head to a pool to LP.</p>;

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">Your positions</h1>
      {tokenIds.map((id) => (
        <PositionRow key={id.toString()} tokenId={id} />
      ))}
    </div>
  );
}

function PositionRow({ tokenId }: { tokenId: bigint }) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const { send } = useKelvinTx();
  const kit = useInterwovenKit() as any;
  const address: string | undefined = kit?.address;

  const { data: posRaw } = useReadContract({
    address: addresses.positionManager,
    abi: positionManagerAbi,
    functionName: "getPosition",
    args: [tokenId],
    query: { refetchInterval: 2_000 },
  });
  const { data: pendingRaw } = useReadContract({
    address: addresses.positionManager,
    abi: positionManagerAbi,
    functionName: "pendingFees",
    args: [tokenId],
    query: { refetchInterval: 1_500 },
  });
  const { data: nameRaw } = useReadContract({
    address: addresses.positionManager,
    abi: positionManagerAbi,
    functionName: "initName",
    args: [tokenId],
  });
  const position: any = posRaw;
  const pending = (pendingRaw ?? [0n, 0n]) as [bigint, bigint];
  const name = (nameRaw as string | undefined) ?? "";

  async function collect() {
    if (!address) return;
    setBusy(true);
    try {
      setStatus("Collecting fees…");
      const res = await send({
        to: addresses.positionManager,
        abi: positionManagerAbi,
        functionName: "collectFees",
        args: [tokenId, address as `0x${string}`],
      });
      setStatus(`Collected · ${res?.transactionHash?.slice(0, 10) ?? "ok"}…`);
    } catch (e: any) {
      setStatus("Failed: " + (e?.shortMessage ?? e?.message ?? "unknown"));
    } finally {
      setBusy(false);
    }
  }

  async function burn() {
    if (!address) return;
    if (!confirm(`Burn position #${tokenId}? This withdraws all liquidity.`)) return;
    setBusy(true);
    try {
      setStatus("Burning…");
      const res = await send({
        to: addresses.positionManager,
        abi: positionManagerAbi,
        functionName: "burnPosition",
        args: [tokenId, address as `0x${string}`],
      });
      setStatus(`Burned · ${res?.transactionHash?.slice(0, 10) ?? "ok"}…`);
    } catch (e: any) {
      setStatus("Failed: " + (e?.shortMessage ?? e?.message ?? "unknown"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded border border-border bg-panel p-4 space-y-2">
      <div className="flex items-baseline justify-between">
        <div>
          <span className="font-semibold">#{tokenId.toString()}</span>
          {name && (
            <span className="text-xs text-accent ml-2">{name}</span>
          )}
          {!name && address && (
            <span className="text-xs text-muted ml-2">
              <InitName address={address} fallback="unnamed" />
            </span>
          )}
        </div>
        <span className="text-xs text-muted">
          {position?.binIds?.length ?? 0} bins
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <Stat label="principal X" value={fmtBI(position?.principalX, 18)} />
        <Stat label="principal Y" value={fmtBI(position?.principalY, 6)} />
        <Stat label="collected" value={`${fmtBI(position?.feesCollectedX, 18)} / ${fmtBI(position?.feesCollectedY, 6)}`} />
        <Stat label="pending X" value={fmtBI(pending[0], 18)} hot={pending[0] > 0n} />
        <Stat label="pending Y" value={fmtBI(pending[1], 6)} hot={pending[1] > 0n} />
        <div />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={collect}
          disabled={busy}
          className="flex-1 bg-accent text-black text-sm font-semibold py-1.5 rounded hover:opacity-90 disabled:opacity-40"
        >
          Collect
        </button>
        <button
          onClick={burn}
          disabled={busy}
          className="flex-1 bg-panel border border-border text-sm py-1.5 rounded hover:border-bad hover:text-bad disabled:opacity-40"
        >
          Burn
        </button>
      </div>
      {status && <p className="text-xs text-muted tick rounded px-2 py-1">{status}</p>}
    </div>
  );
}

function Stat({ label, value, hot }: { label: string; value: string; hot?: boolean }) {
  return (
    <div>
      <div className="text-muted text-xs">{label}</div>
      <div className={hot ? "text-good" : ""}>{value}</div>
    </div>
  );
}

function fmtBI(x: bigint | undefined, decimals: number): string {
  if (x === undefined || x === 0n) return "0";
  return Number(formatUnits(x, decimals)).toLocaleString(undefined, {
    maximumFractionDigits: 4,
  });
}
