import { getBadge } from "@/lib/data/badges";
import type { BadgeKey } from "@/lib/types";
import { cn } from "@/lib/utils";

interface OwnerBadgeProps {
  badgeKey: BadgeKey;
  /** Show text label next to emoji (draft list). Default: icon only. */
  showLabel?: boolean;
  className?: string;
}

/** Circular badge chip matching the Fake Football reference style. */
export function OwnerBadge({
  badgeKey,
  showLabel = false,
  className,
}: OwnerBadgeProps) {
  const badge = getBadge(badgeKey);

  return (
    <span
      title={`${badge.label} — ${badge.description}`}
      className={cn(
        "relative inline-flex items-center justify-center rounded-full border-2 font-bold shadow-sm h-8 min-w-8 px-1.5 text-sm gap-0.5",
        badge.className,
        showLabel && "px-2 gap-1",
        className
      )}
    >
      <span className="leading-none" aria-hidden="true">
        {badge.emoji}
      </span>
      {showLabel ? (
        <span className="text-[10px] uppercase tracking-wide">{badge.label}</span>
      ) : (
        <span className="sr-only">{badge.label}</span>
      )}
    </span>
  );
}
