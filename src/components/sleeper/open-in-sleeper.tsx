import { cn } from "@/lib/utils";
import {
  resolveSleeperLeagueId,
  sleeperLeagueAppUrl,
  sleeperLeagueWebUrl,
} from "@/lib/sleeper/links";

/**
 * Compact “Open in Sleeper” control (Fake Football “Go to ESPN league” voice).
 * Always exposes https; on small screens also offers the sleeper:// app deep link.
 */
export function OpenInSleeper({
  leagueId,
  className,
}: {
  /** From league_settings.sleeper_league_id — falls back to default */
  leagueId?: string | null;
  className?: string;
}) {
  const id = resolveSleeperLeagueId(leagueId);
  const https = sleeperLeagueWebUrl(id);
  const app = sleeperLeagueAppUrl(id);

  return (
    <span
      className={cn(
        "inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-bold uppercase tracking-wider",
        className
      )}
    >
      <a
        href={https}
        target="_blank"
        rel="noopener noreferrer"
        className="underline decoration-2 underline-offset-4 hover:opacity-80"
      >
        Open in Sleeper →
      </a>
      <a
        href={app}
        className="text-[10px] font-semibold normal-case tracking-normal text-muted-foreground underline underline-offset-2 sm:hidden"
        aria-label="Open in Sleeper app"
      >
        App
      </a>
    </span>
  );
}
