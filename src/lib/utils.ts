import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes with conflict resolution (shadcn pattern). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format cents or dollars as USD currency. */
export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format W-L record for display. */
export function formatRecord(wins: number, losses: number, ties = 0): string {
  if (ties > 0) return `${wins}-${losses}-${ties}`;
  return `${wins}-${losses}`;
}

/**
 * Win percentage: (wins + 0.5*ties) / games.
 * Returns 0–1. Empty schedule → 0.
 */
export function computeWinPct(
  wins: number,
  losses: number,
  ties = 0
): number {
  const games = wins + losses + ties;
  if (games <= 0) return 0;
  return (wins + 0.5 * ties) / games;
}

/** Points for/against display (one decimal). Never returns "—". */
export function formatPoints(n: number | null | undefined, digits = 1): string {
  if (n == null || !Number.isFinite(Number(n))) return "0";
  return Number(n).toFixed(digits);
}

/** Display win % as e.g. "68.8%". Never "—" (0.0% if no games). */
export function formatWinPct(
  wins: number,
  losses: number,
  ties = 0,
  digits = 1
): string {
  const games = wins + losses + ties;
  if (games <= 0) return `${(0).toFixed(digits)}%`;
  return `${(computeWinPct(wins, losses, ties) * 100).toFixed(digits)}%`;
}
