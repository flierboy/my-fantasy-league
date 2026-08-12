import { formatMoney } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface MoneyChipProps {
  amount: number;
  className?: string;
}

/** Green cash-stack chip for career prize money. */
export function MoneyChip({ amount, className }: MoneyChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border-2 border-foreground bg-emerald-500 px-2 py-0.5 font-mono text-[11px] font-bold tabular-nums text-white",
        className
      )}
      title="Career prize money"
    >
      <CashStackIcon className="h-4 w-4 shrink-0" />
      <span>{formatMoney(amount)}</span>
    </span>
  );
}

function CashStackIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 40"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="4"
        y="4"
        width="36"
        height="22"
        rx="3"
        fill="#15803d"
        stroke="#141414"
        strokeWidth="2.5"
      />
      <rect
        x="6"
        y="9"
        width="36"
        height="22"
        rx="3"
        fill="#22c55e"
        stroke="#141414"
        strokeWidth="2.5"
      />
      <rect
        x="8"
        y="14"
        width="36"
        height="22"
        rx="3"
        fill="#4ade80"
        stroke="#141414"
        strokeWidth="2.5"
      />
      <ellipse cx="26" cy="25" rx="7" ry="6" fill="#14532d" opacity="0.2" />
      <text
        x="26"
        y="28"
        textAnchor="middle"
        fill="#14532d"
        fontSize="11"
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
      >
        $
      </text>
    </svg>
  );
}
