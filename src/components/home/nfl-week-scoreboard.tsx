import type { NflWeekScoreboard } from "@/lib/nfl/scoreboard";
import { formatKickoffTimeCt } from "@/lib/data/events-format";
import { cn } from "@/lib/utils";

/**
 * Compact THIS WEEK · NFL slate — one line per game, day headers,
 * 2-col from sm. Hub can pass scrollable to cap height.
 */
export function NflWeekScoreboardView({
  board,
  hero = false,
  scrollable = false,
  className,
}: {
  board: NflWeekScoreboard;
  hero?: boolean;
  /** Cap height + internal scroll (Hub) */
  scrollable?: boolean;
  className?: string;
}) {
  const { byDay, week, games } = board;

  return (
    <section
      className={cn(
        hero ? "mx-auto w-full max-w-2xl text-left" : "w-full text-left",
        className
      )}
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p
            className={cn(
              "ff-ribbon text-[10px] !px-3 !py-1",
              hero && "border-white/30 bg-white/10 text-white"
            )}
          >
            {week != null ? `Week ${week}` : "NFL"}
          </p>
          <h2
            className={cn(
              "ff-display mt-2 tracking-tight",
              hero ? "text-2xl text-white sm:text-3xl" : "text-xl"
            )}
          >
            THIS WEEK · NFL
          </h2>
        </div>
      </div>

      {games.length === 0 ? (
        <p
          className={cn(
            "mt-3 text-sm",
            hero ? "text-white/75" : "text-muted-foreground"
          )}
        >
          Slate posts when ESPN publishes the week
        </p>
      ) : (
        <div
          className={cn(
            "mt-3",
            scrollable &&
              "max-h-[min(42vh,20rem)] overflow-y-auto overscroll-contain pr-1 [-webkit-overflow-scrolling:touch]",
            hero && "rounded-lg border border-white/15 bg-black/35 px-2.5 py-2"
          )}
        >
          <div className="space-y-3">
            {byDay.map((group) => (
              <div key={group.day}>
                <p
                  className={cn(
                    "mb-1 text-[10px] font-bold uppercase tracking-[0.18em]",
                    hero ? "text-[var(--accent-gold)]" : "text-muted-foreground"
                  )}
                >
                  {group.day}
                </p>
                <ul className="grid gap-x-3 gap-y-0.5 sm:grid-cols-2">
                  {group.games.map((g) => (
                    <li
                      key={g.id}
                      className={cn(
                        "flex min-w-0 items-baseline gap-1.5 py-0.5 text-[11px] leading-snug sm:text-xs",
                        hero ? "text-white/90" : "text-foreground"
                      )}
                    >
                      <span className="ff-display min-w-0 shrink truncate text-[11px] tracking-wide sm:text-xs">
                        {g.away} @ {g.home}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 whitespace-nowrap font-semibold",
                          hero ? "text-white/55" : "text-muted-foreground"
                        )}
                      >
                        · {formatKickoffTimeCt(g.starts_at)}
                      </span>
                      {g.network && (
                        <span
                          className={cn(
                            "hidden shrink-0 whitespace-nowrap font-semibold sm:inline",
                            hero ? "text-white/45" : "text-muted-foreground"
                          )}
                        >
                          · {g.network}
                        </span>
                      )}
                      <span
                        className={cn(
                          "ml-auto shrink-0 font-mono text-[10px] font-bold tabular-nums sm:text-[11px]",
                          g.state === "in"
                            ? "text-emerald-500"
                            : g.state === "post"
                              ? hero
                                ? "text-white/90"
                                : "text-foreground"
                              : hero
                                ? "text-white/50"
                                : "text-muted-foreground"
                        )}
                      >
                        {g.status_label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
