// DLMM math helpers, mirroring Trader Joe Liquidity Book v2.1.1 conventions.
// See: contracts/evm/src/lb/libraries/PriceHelper.sol

export const ACTIVE_ID_MIDPOINT = 8_388_608; // 2^23 — price = 1.0

/**
 * Price of a bin in Y per X. binStep is in basis points (e.g. 25 = 0.25%).
 * For UI display only — the contracts use 128.128 fixed point.
 */
export function priceFromBinId(id: number, binStep: number): number {
  return Math.pow(1 + binStep / 10_000, id - ACTIVE_ID_MIDPOINT);
}

export function binIdFromPrice(price: number, binStep: number): number {
  return Math.round(
    ACTIVE_ID_MIDPOINT + Math.log(price) / Math.log(1 + binStep / 10_000)
  );
}

/**
 * Encode a single LB LiquidityConfiguration bytes32.
 * Layout: [0-24]=binId, [24-88]=distributionY, [88-152]=distributionX.
 * Distributions are in PRECISION = 1e18 units.
 */
export function encodeLiquidityConfig(
  binId: number,
  distributionX: bigint,
  distributionY: bigint
): `0x${string}` {
  const x = distributionX & ((1n << 64n) - 1n);
  const y = distributionY & ((1n << 64n) - 1n);
  const id = BigInt(binId) & ((1n << 24n) - 1n);
  const packed = (x << 88n) | (y << 24n) | id;
  return ("0x" + packed.toString(16).padStart(64, "0")) as `0x${string}`;
}

/**
 * Build a symmetric spot distribution across (2*halfSpan+1) bins centered on activeId.
 * Honors LB composition rule: bins < active get only Y, bins > active get only X,
 * active bin gets both.
 */
export function buildSpotConfigs(
  activeId: number,
  halfSpan: number
): `0x${string}`[] {
  const PRECISION = 10n ** 18n;
  const n = halfSpan + 1;
  const share = PRECISION / BigInt(n);
  const configs: `0x${string}`[] = [];
  for (let i = -halfSpan; i <= halfSpan; i++) {
    const id = activeId + i;
    const dx = i >= 0 ? share : 0n;
    const dy = i <= 0 ? share : 0n;
    configs.push(encodeLiquidityConfig(id, dx, dy));
  }
  return configs;
}

/**
 * Decode an LB packed bytes32 (amountsX in low 128, amountsY in high 128).
 */
export function decodePacked128(packed: `0x${string}`): {
  x: bigint;
  y: bigint;
} {
  const full = BigInt(packed);
  const mask = (1n << 128n) - 1n;
  return { x: full & mask, y: (full >> 128n) & mask };
}
