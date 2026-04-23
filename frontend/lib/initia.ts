// Initia testnet + Kelvin rollup configuration.
// Populated at deploy time — the UI reads NEXT_PUBLIC_* env vars so the same
// build works against local anvil, a shared devnet, or a fresh rollup.

export const kelvinChainId =
  process.env.NEXT_PUBLIC_KELVIN_CHAIN_ID ?? "kelvin-1";

export const kelvinRpcUrl =
  process.env.NEXT_PUBLIC_KELVIN_RPC_URL ?? "http://localhost:8545";

export const kelvinExplorerUrl =
  process.env.NEXT_PUBLIC_KELVIN_EXPLORER_URL ??
  "https://scan.testnet.initia.xyz/kelvin-1";

export function txExplorerUrl(hash: string): string {
  return `${kelvinExplorerUrl}/tx/${hash}`;
}

export function addressExplorerUrl(addr: string): string {
  return `${kelvinExplorerUrl}/address/${addr}`;
}

// L1 REST base for Move view calls (Initia Usernames module lives there).
export const l1RestUrl =
  process.env.NEXT_PUBLIC_L1_REST_URL ?? "https://rest.testnet.initia.xyz";
