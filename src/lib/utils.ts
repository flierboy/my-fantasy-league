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
