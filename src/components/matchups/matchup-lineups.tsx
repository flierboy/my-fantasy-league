import type { LineupPlayer, Matchup } from "@/lib/types";
import { hasPostedStarters } from "@/lib/sleeper/lineups";
import { cn } from "@/lib/utils";

/**
 * Two-column (stacked on mobile) starters comparison for a matchup.
 */
export function MatchupLineups({
  matchup,
  compact = false,
  showBench = false,
  homeLabel,
  awayLabel,
}: {
  matchup: Matchup;
  compact?: boolean;
  showBench?: boolean;
  homeLabel?: string;
  awayLabel?: string;
}) {
  const homeOk = hasPostedStarters(matchup.home_starters);
  const awayOk = hasPostedStarters(matchup.away_starters);
  const either = homeOk || awayOk;

  if (!either) {
    return (
      <p
        className={cn(
          "text-xs text-muted-foreground",
          compact ? "mt-2" : "mt-3 border-t border-border pt-3"
        )}
      >
        Lineup posts after Sleeper sets Week {matchup.week}.
      </p>
    );
  }

  return (
    <div
      className={cn(
        compact ? "mt-3 space-y-3" : "mt-4 space-y-4 border-t border-border pt-4"
      )}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <LineupColumn
          title={homeLabel ?? matchup.home_owner?.display_name ?? "Home"}
          starters={matchup.home_starters}
          bench={showBench ? matchup.home_bench : undefined}
          compact={compact}
          emptyWeek={matchup.week}
        />
        <LineupColumn
          title={awayLabel ?? matchup.away_owner?.display_name ?? "Away"}
          starters={matchup.away_starters}
          bench={showBench ? matchup.away_bench : undefined}
          compact={compact}
          emptyWeek={matchup.week}
        />
      </div>
    </div>
  );
}

function LineupColumn({
  title,
  starters,
  bench,
  compact,
  emptyWeek,
}: {
  title: string;
  starters: LineupPlayer[];
  bench?: LineupPlayer[];
  compact?: boolean;
  emptyWeek: number;
}) {
  const posted = hasPostedStarters(starters);
  return (
    <div className="min-w-0 rounded-lg border border-border bg-[#faf9f7] p-2.5 sm:p-3">
      <p className="ff-display truncate text-xs tracking-wide text-muted-foreground">
        {title}
      </p>
      {!posted ? (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Lineup posts after Sleeper sets Week {emptyWeek}.
        </p>
      ) : (
        <ul className={cn("mt-2 space-y-1", compact && "space-y-0.5")}>
          {starters.map((p, i) => (
            <LineupRow key={`${p.slot}-${p.player_id || i}`} player={p} compact={compact} />
          ))}
        </ul>
      )}
      {bench && bench.length > 0 && (
        <>
          <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Bench
          </p>
          <ul className="mt-1 space-y-0.5">
            {bench.map((p, i) => (
              <LineupRow
                key={`bn-${p.player_id || i}`}
                player={p}
                compact
              />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function LineupRow({
  player,
  compact,
}: {
  player: LineupPlayer;
  compact?: boolean;
}) {
  const empty = !player.player_id;
  const pts = Number.isFinite(player.points) ? player.points : 0;
  return (
    <li
      className={cn(
        "grid grid-cols-[2.5rem_1fr_2rem_2.75rem] items-baseline gap-1 text-[11px] sm:grid-cols-[2.75rem_1fr_2.25rem_3rem] sm:text-xs",
        compact && "text-[10px] sm:text-[11px]"
      )}
    >
      <span className="font-mono font-bold uppercase tabular-nums text-muted-foreground">
        {player.slot || "—"}
      </span>
      <span className={cn("truncate font-semibold", empty && "text-muted-foreground")}>
        {empty
          ? "—"
          : [player.name || player.player_id, player.pos]
              .filter(Boolean)
              .join(" ")}
      </span>
      <span className="truncate text-right font-mono text-muted-foreground">
        {empty ? "" : player.nfl_team || ""}
      </span>
      <span className="text-right font-mono font-bold tabular-nums">
        {empty ? "" : pts.toFixed(1)}
      </span>
    </li>
  );
}

/** Single-team roster list (starters then bench) for owner profiles. */
export function OwnerRosterLineup({
  starters,
  bench,
  week,
}: {
  starters: LineupPlayer[];
  bench: LineupPlayer[];
  week: number;
}) {
  if (!hasPostedStarters(starters) && bench.length === 0) {
    return (
      <p className="ff-card border-dashed p-5 text-sm text-muted-foreground">
        Lineup posts after Sleeper sets Week {week}.
      </p>
    );
  }

  return (
    <div className="ff-card overflow-hidden">
      <div className="border-b border-border bg-[#f4f2ef] px-4 py-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Week {week} · starters
        </p>
      </div>
      <ul className="divide-y divide-border px-3 py-1">
        {starters.map((p, i) => (
          <li key={`s-${p.slot}-${p.player_id || i}`} className="py-1.5">
            <LineupRow player={p} />
          </li>
        ))}
      </ul>
      {bench.length > 0 && (
        <>
          <div className="border-y border-border bg-[#f4f2ef] px-4 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Bench
            </p>
          </div>
          <ul className="divide-y divide-border px-3 py-1">
            {bench.map((p, i) => (
              <li key={`b-${p.player_id || i}`} className="py-1.5">
                <LineupRow player={p} compact />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
