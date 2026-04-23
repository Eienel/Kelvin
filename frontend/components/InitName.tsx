"use client";
import { useInterwovenKit } from "@initia/interwovenkit-react";

/**
 * Renders an Initia Username (handle.init) for an EVM or bech32 address,
 * falling back to the provided label.
 *
 * Resolution flows through InterwovenKit's cached `useUsernameQuery`,
 * which calls the L1 Move `usernames::get_name_from_address` view.
 * MiniEVM has no on-chain username registry, so this is an L1 read —
 * typically ~50ms on testnet, cached for the session.
 */
export function InitName({
  address,
  fallback,
}: {
  address: string;
  fallback: string;
}) {
  const kit = useInterwovenKit() as any;
  // InterwovenKit exposes a hook-like helper. Some package versions
  // rename it; we try both common shapes.
  const useUsernameQuery =
    kit?.useUsernameQuery ?? kit?.hooks?.useUsernameQuery;
  const { data } = useUsernameQuery
    ? useUsernameQuery(address)
    : { data: undefined };

  const name: string | undefined = data?.username ?? data?.name ?? data;
  if (name && typeof name === "string") {
    return (
      <span title={address}>
        <span className="text-accent">{name}</span>
      </span>
    );
  }
  return <span title={address}>{fallback}</span>;
}
