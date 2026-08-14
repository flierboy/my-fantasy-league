import { cn } from "@/lib/utils";

/**
 * Paper-card table wrapper with mobile horizontal scroll + hint.
 * Desktop: full table, no chrome noise. Mobile: swipeable with edge fade.
 */
export function ScrollableTable({
  children,
  className,
  minWidth = "36rem",
  hint = "Swipe sideways for full table",
  showHint = true,
}: {
  children: React.ReactNode;
  className?: string;
  /** Min width so columns don't crush on phones */
  minWidth?: string;
  hint?: string;
  showHint?: boolean;
}) {
  return (
    <div className={cn("ff-card overflow-hidden", className)}>
      {showHint && (
        <p className="border-b border-border/80 bg-[#f4f2ef] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:hidden">
          ← {hint} →
        </p>
      )}
      <div
        className="ff-table-scroll overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]"
        role="region"
        aria-label="Scrollable table"
        tabIndex={0}
      >
        <div style={{ minWidth }} className="w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
