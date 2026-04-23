import type { Address } from "viem";

// Deployment addresses — filled by scripts/save-deployment.ts after
// `forge script Deploy` runs against the Kelvin rollup.
export const addresses = {
  factory: (process.env.NEXT_PUBLIC_LB_FACTORY_ADDRESS ?? "0x") as Address,
  router: (process.env.NEXT_PUBLIC_LB_ROUTER_ADDRESS ?? "0x") as Address,
  positionManager: (process.env.NEXT_PUBLIC_POSITION_MANAGER_ADDRESS ?? "0x") as Address,
  feeRouter: (process.env.NEXT_PUBLIC_FEE_ROUTER_ADDRESS ?? "0x") as Address,
  // Demo tokens.
  mUSDC: (process.env.NEXT_PUBLIC_MOCK_USDC_ADDRESS ?? "0x") as Address,
  mETH: (process.env.NEXT_PUBLIC_MOCK_ETH_ADDRESS ?? "0x") as Address,
  mINIT: (process.env.NEXT_PUBLIC_MOCK_INIT_ADDRESS ?? "0x") as Address,
  // Demo pairs.
  ethUsdc: (process.env.NEXT_PUBLIC_PAIR_ETH_USDC ?? "0x") as Address,
  initUsdc: (process.env.NEXT_PUBLIC_PAIR_INIT_USDC ?? "0x") as Address,
} as const;

export const pools = [
  {
    id: "eth-usdc",
    name: "mETH / mUSDC",
    base: "mETH",
    quote: "mUSDC",
    pair: addresses.ethUsdc,
    tokenX: addresses.mETH,
    tokenY: addresses.mUSDC,
    binStep: 25,
  },
  {
    id: "init-usdc",
    name: "mINIT / mUSDC",
    base: "mINIT",
    quote: "mUSDC",
    pair: addresses.initUsdc,
    tokenX: addresses.mINIT,
    tokenY: addresses.mUSDC,
    binStep: 25,
  },
] as const;

export type Pool = (typeof pools)[number];
