import type { PrimetimeGame } from "@/lib/nfl/primetime";
import { formatKickoffChicago } from "@/lib/data/events-format";
import { cn } from "@/lib/utils";

/**
 * Public landing / Hub card: THIS WEEK · PRIMETIME (TNF / Sat / SNF / MNF).
 */
export function PrimetimeSlate({
  games,
  week,
  hero = false,
  className,
}: {
  games: PrimetimeGame[];
  week: number | null;
  hero?: boolean;
  className?: string;
}) {
  return (
    <section
      className={cn(
        hero
          ? "mx-auto w-full max-w-lg text-center"
          : "w-full",
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
        THIS WEEK · PRIMETIME
      </h2>
      {games.length === 0 ? (
        <p
          className={cn(
            "mt-4 text-sm",
            hero ? "text-white/75" : "text-muted-foreground"
          )}
        >
          Primetime slate posts weekly
        </p>
      ) : (
        <ul
          className={cn(
            "mt-5 space-y-2 text-left",
            hero && "rounded-xl border-2 border-white/20 bg-black/40 p-3 backdrop-blur-sm sm:p-4"
          )}
        >
          {games.map((g) => (
            <li
              key={g.id}
              className={cn(
                "rounded-lg px-3 py-2.5",
                hero
                  ? "bg-white/5"
                  : "border border-border bg-white"
              )}
            >
              <p
                className={cn(
                  "text-[10px] font-bold uppercase tracking-[0.16em]",
                  hero ? "text-[var(--accent-gold)]" : "text-muted-foreground"
                )}
              >
                {g.night}
              </p>
              <p
                className={cn(
                  "ff-display mt-1 text-lg tracking-wide",
                  hero ? "text-white" : "text-foreground"
                )}
              >
                {g.away} @ {g.home}
              </p>
              <p
                className={cn(
                  "mt-0.5 text-xs font-semibold sm:text-sm",
                  hero ? "text-white/80" : "text-muted-foreground"
                )}
              >
                {formatKickoffChicago(g.starts_at)}
                {g.network ? ` · ${g.network}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
