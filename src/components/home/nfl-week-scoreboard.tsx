import type { NflWeekScoreboard } from "@/lib/nfl/scoreboard";
import { formatKickoffChicago } from "@/lib/data/events-format";
import { cn } from "@/lib/utils";

/**
 * THIS WEEK · NFL — full slate grouped by day (login + Hub).
 */
export function NflWeekScoreboardView({
  board,
  hero = false,
  className,
}: {
  board: NflWeekScoreboard;
  hero?: boolean;
  className?: string;
}) {
  const { byDay, week, games } = board;

  return (
    <section
      className={cn(
        hero ? "mx-auto w-full max-w-xl text-center" : "w-full",
        className
      )}
    >
      <p className="ff-ribbon text-[10px] !px-3 !py-1">
        {week != null ? `Week ${week}` : "NFL"}
      </p>
      <h2
        className={cn(
          "ff-display mt-3 tracking-tight",
          hero ? "text-3xl text-white sm:text-4xl" : "text-xl"
        )}
      >
        THIS WEEK · NFL
      </h2>

      {games.length === 0 ? (
        <p
          className={cn(
            "mt-4 text-sm",
            hero ? "text-white/75" : "text-muted-foreground"
          )}
        >
          Slate posts when ESPN publishes the week
        </p>
      ) : (
        <div
          className={cn(
            "mt-5 space-y-5 text-left",
            hero &&
              "rounded-xl border-2 border-white/20 bg-black/40 p-3 backdrop-blur-sm sm:p-4"
          )}
        >
          {byDay.map((group) => (
            <div key={group.day}>
              <p
                className={cn(
                  "text-[10px] font-bold uppercase tracking-[0.16em]",
                  hero ? "text-[var(--accent-gold)]" : "text-muted-foreground"
                )}
              >
                {group.label}
              </p>
              <ul className="mt-2 space-y-1.5">
                {group.games.map((g) => (
                  <li
                    key={g.id}
                    className={cn(
                      "rounded-lg px-3 py-2",
                      hero ? "bg-white/5" : "border border-border bg-white"
                    )}
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                      <p
                        className={cn(
                          "ff-display text-base tracking-wide sm:text-lg",
                          hero ? "text-white" : "text-foreground"
                        )}
                      >
                        {g.away} @ {g.home}
                      </p>
                      <p
                        className={cn(
                          "font-mono text-xs font-bold tabular-nums",
                          g.state === "post"
                            ? hero
                              ? "text-white/90"
                              : "text-foreground"
                            : g.state === "in"
                              ? "text-emerald-600"
                              : hero
                                ? "text-white/60"
                                : "text-muted-foreground"
                        )}
                      >
                        {g.status_label}
                      </p>
                    </div>
                    <p
                      className={cn(
                        "mt-0.5 text-[11px] font-semibold sm:text-xs",
                        hero ? "text-white/75" : "text-muted-foreground"
                      )}
                    >
                      {formatKickoffChicago(g.starts_at)}
                      {g.network ? ` · ${g.network}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
