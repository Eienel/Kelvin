"use client";
import { useInterwovenKit } from "@initia/interwovenkit-react";
import { useEffect, useState } from "react";
import { kelvinChainId } from "@/lib/initia";

/**
 * Session UX is Kelvin's hero feature: a user approves one drawer, then
 * rebalances, collects fees, and re-opens positions with zero further
 * popups until the grant expires.
 *
 * The pill surfaces remaining session time so the demo moment is visible.
 */
export function SessionPill() {
  let kit: any;
  try {
    kit = useInterwovenKit() as any;
  } catch {
    return null;
  }
  const autoSign = kit?.autoSign;
  const address: string | undefined = kit?.address;
  const expiresAt: number | undefined = autoSign?.expiredAtByChain?.[kelvinChainId];
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  if (!address) return null;

  const now = Date.now();
  const active = expiresAt != null && expiresAt > now;
  const remaining = active ? Math.max(0, Math.floor((expiresAt! - now) / 1000)) : 0;

  if (!active) {
    return (
      <button
        onClick={() => autoSign?.enable?.(kelvinChainId)}
        className="text-xs border border-accent text-accent px-2 py-1 rounded hover:bg-accent hover:text-black"
        title="Grant Kelvin permission to sign rebalance / collect txs for you"
      >
        ○ Enable session
      </button>
    );
  }

  const mm = Math.floor(remaining / 60);
  const ss = (remaining % 60).toString().padStart(2, "0");
  return (
    <button
      onClick={() => autoSign?.disable?.(kelvinChainId)}
      className="text-xs border border-good text-good px-2 py-1 rounded hover:bg-good hover:text-black"
      title="Revoke session — future txs will pop a confirmation drawer"
    >
      ● Session · {mm}:{ss}
    </button>
  );
}
