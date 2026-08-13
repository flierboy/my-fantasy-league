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

/** Display win % as e.g. "68.8%" or "—" if no games. */
export function formatWinPct(
  wins: number,
  losses: number,
  ties = 0,
  digits = 1
): string {
  const games = wins + losses + ties;
  if (games <= 0) return "—";
  return `${(computeWinPct(wins, losses, ties) * 100).toFixed(digits)}%`;
}

/** Points for/against display (one decimal when needed). */
export function formatPoints(n: number, digits = 1): string {
  if (!Number.isFinite(n)) return "—";
  const fixed = n.toFixed(digits);
  // Drop trailing .0 for whole numbers when digits=1 looks cleaner as-is with tabular
  return fixed;
}
