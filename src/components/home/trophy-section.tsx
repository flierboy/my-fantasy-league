import type { LeagueSettings } from "@/lib/types";

interface TrophySectionProps {
  league: LeagueSettings;
}

export function TrophySection({ league }: TrophySectionProps) {
  return (
    <section className="relative overflow-hidden rounded-xl border-2 border-foreground bg-white shadow-sm">
      <div className="ff-top-stripe" />
      <div className="grid items-center gap-6 p-5 sm:grid-cols-[minmax(0,10rem)_1fr] sm:gap-8 sm:p-7 md:grid-cols-[minmax(0,12rem)_1fr]">
        <div className="flex justify-center">
          <div className="rounded-lg border-2 border-border bg-gradient-to-b from-[#f4f2ef] to-white px-3 py-3">
            {/* Trophy placeholder — drop a trophy.jpg in /public when ready */}
            <div
              className="flex h-36 w-28 items-center justify-center sm:h-40 sm:w-32"
              role="img"
              aria-label="League championship trophy"
            >
              <span className="text-7xl drop-shadow-md sm:text-8xl" aria-hidden>
                🏆
              </span>
            </div>
          </div>
        </div>

        <div className="text-center sm:text-left">
          <p className="ff-ribbon text-[10px] !px-3 !py-1">The hardware</p>
          <h2 className="ff-display mt-2 text-2xl tracking-tight sm:text-3xl">
            League championship trophy
          </h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            {league.trophy_blurb}
          </p>
        </div>
      </div>
    </section>
  );
}
