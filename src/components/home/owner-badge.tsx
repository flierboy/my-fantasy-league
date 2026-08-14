import { getBadge } from "@/lib/data/badges";
import type { BadgeKey } from "@/lib/types";
import { cn } from "@/lib/utils";

interface OwnerBadgeProps {
  badgeKey: BadgeKey;
  /** Show text label next to emoji (draft list). Default: icon only. */
  showLabel?: boolean;
  /** e.g. "Week 3" for weekly awards */
  weekLabel?: string | null;
  className?: string;
}

/** Circular badge chip matching the Fake Football reference style. */
export function OwnerBadge({
  badgeKey,
  showLabel = false,
  weekLabel,
  className,
}: OwnerBadgeProps) {
  const badge = getBadge(badgeKey);
  const title = weekLabel
    ? `${badge.label} – ${weekLabel} — ${badge.description}`
    : `${badge.label} — ${badge.description}`;

  return (
    <span
      title={title}
      className={cn(
        "relative inline-flex items-center justify-center rounded-full border-2 font-bold shadow-sm h-8 min-w-8 px-1.5 text-sm gap-0.5",
        badge.className,
        showLabel && "px-2 gap-1",
        weekLabel && showLabel && "h-auto min-h-8 py-1",
        className
      )}
    >
      <span className="leading-none" aria-hidden="true">
        {badge.emoji}
      </span>
      {showLabel ? (
        <span className="flex flex-col items-start leading-tight">
          <span className="text-[10px] uppercase tracking-wide">
            {badge.label}
          </span>
          {weekLabel ? (
            <span className="text-[9px] font-semibold normal-case tracking-normal opacity-90">
              {weekLabel}
            </span>
          ) : null}
        </span>
      ) : (
        <span className="sr-only">
          {badge.label}
          {weekLabel ? ` – ${weekLabel}` : ""}
        </span>
      )}
    </span>
  );
}
