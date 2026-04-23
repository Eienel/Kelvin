"use client";
import { useInterwovenKit } from "@initia/interwovenkit-react";
import { shortAddr } from "@/lib/format";
import { InitName } from "./InitName";

export function WalletButton() {
  const kit = useInterwovenKit() as any;
  const address: string | undefined = kit?.address;
  const openConnect: () => void = kit?.openConnect;
  const openWallet: () => void = kit?.openWallet;

  if (!address) {
    return (
      <button
        onClick={() => openConnect?.()}
        className="bg-accent text-black font-semibold text-sm px-3 py-1.5 rounded hover:opacity-90"
      >
        Connect
      </button>
    );
  }
  return (
    <button
      onClick={() => openWallet?.()}
      className="bg-panel border border-border text-sm px-3 py-1.5 rounded hover:bg-border"
      title={address}
    >
      <InitName address={address} fallback={shortAddr(address)} />
    </button>
  );
}
