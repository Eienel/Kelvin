import { formatUnits } from "viem";

export function fmt(x: bigint, decimals = 18, precision = 4): string {
  const asNumber = Number(formatUnits(x, decimals));
  if (asNumber === 0) return "0";
  if (Math.abs(asNumber) < 0.0001) return asNumber.toExponential(2);
  return asNumber.toLocaleString(undefined, {
    maximumFractionDigits: precision,
    minimumFractionDigits: Math.min(2, precision),
  });
}

export function shortAddr(a?: string): string {
  if (!a) return "";
  return a.slice(0, 6) + "…" + a.slice(-4);
}
