import Link from "next/link";
import { getMatchupsData } from "@/lib/data/dashboard";
import { formatRecord } from "@/lib/utils";
import { OwnerAvatar } from "@/components/home/owner-avatar";
import { ScrollableTable } from "@/components/ui/scrollable-table";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Matchups",
};

export default async function MatchupsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const sp = await searchParams;
  const { matchups, standings, season, week: latestWeek } =
    await getMatchupsData();

  // Group matchups by week (latest first)
  const byWeek = new Map<number, typeof matchups>();
  for (const m of matchups) {
    const list = byWeek.get(m.week) ?? [];
    list.push(m);
    byWeek.set(m.week, list);
  }
  const weeks = [...byWeek.keys()].sort((a, b) => b - a);

  const requested = sp.week ? Number.parseInt(sp.week, 10) : null;
  const displayWeek =
    requested != null && Number.isFinite(requested) && byWeek.has(requested)
      ? requested
      : latestWeek ?? weeks[0] ?? null;

  const weekMatchups =
    displayWeek != null ? (byWeek.get(displayWeek) ?? []) : [];

  return (
    <div className="space-y-10">
      <header>
        <p className="ff-ribbon">
          {displayWeek != null ? `Week ${displayWeek}` : `Season ${season}`}
        </p>
        <h1 className="ff-display mt-2 text-3xl tracking-tight">
          Matchups & standings
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Season {season}
          {matchups.length === 0
            ? " · waiting on Week 1"
            : displayWeek != null
              ? ` · week ${displayWeek}`
              : ""}
        </p>
      </header>

      {/* Week picker */}
      {weeks.length > 0 && (
        <nav className="flex flex-wrap gap-2" aria-label="Select week">
          {weeks.map((w) => {
            const active = w === displayWeek;
            return (
              <Link
                key={w}
                href={`/matchups?week=${w}`}
                className={cn(
                  "rounded-lg border-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors",
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-white text-muted-foreground hover:border-foreground hover:text-foreground"
                )}
              >
                Week {w}
                <span className="ml-1.5 font-mono font-normal opacity-70">
                  {byWeek.get(w)?.length ?? 0}
                </span>
              </Link>
            );
          })}
        </nav>
      )}

      <section>
        <h2 className="ff-display mb-3 text-xl">
          {displayWeek != null ? `Week ${displayWeek}` : "This week"}
        </h2>
        {weekMatchups.length === 0 ? (
          <EmptyCard message="No matchups yet — check back after Week 1." />
        ) : (
          <div className="space-y-3">
            {weekMatchups.map((m) => {
              const home = m.home_owner;
              const away = m.away_owner;
              const homeScore = m.home_score;
              const awayScore = m.away_score;
              const homeWins =
                m.is_complete &&
                homeScore != null &&
                awayScore != null &&
                homeScore > awayScore;
              const awayWins =
                m.is_complete &&
                homeScore != null &&
                awayScore != null &&
                awayScore > homeScore;

              return (
                <div
                  key={m.id}
                  className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl border-2 border-foreground bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center gap-2 justify-end text-right">
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "ff-display truncate text-sm",
                          homeWins && "text-emerald-800"
                        )}
                      >
                        {home?.display_name ?? "TBD"}
                        {homeWins ? " ✓" : ""}
                      </p>
                      <p className="font-mono text-sm font-bold tabular-nums">
                        {homeScore != null ? homeScore.toFixed(1) : "—"}
                      </p>
                    </div>
                    {home && (
                      <OwnerAvatar name={home.display_name} size="sm" />
                    )}
                  </div>
                  <span className="ff-display text-xs text-muted-foreground">
                    {m.is_complete ? "final" : "vs"}
                  </span>
                  <div className="flex items-center gap-2">
                    {away && (
                      <OwnerAvatar name={away.display_name} size="sm" />
                    )}
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "ff-display truncate text-sm",
                          awayWins && "text-emerald-800"
                        )}
                      >
                        {awayWins ? "✓ " : ""}
                        {away?.display_name ?? "TBD"}
                      </p>
                      <p className="font-mono text-sm font-bold tabular-nums">
                        {awayScore != null ? awayScore.toFixed(1) : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2 className="ff-display text-xl">Standings</h2>
          <Link
            href="/dashboard"
            className="text-xs font-bold uppercase tracking-wider text-muted-foreground underline"
          >
            Hub →
          </Link>
        </div>
        {standings.length === 0 ? (
          <EmptyCard message="Standings will show up once the season is underway." />
        ) : (
          <ScrollableTable minWidth="28rem" hint="Swipe for full standings">
            <table className="w-full text-sm">
              <thead className="border-b-2 border-foreground bg-[#f4f2ef] text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="ff-sticky-rank px-3 py-3 sm:px-4">#</th>
                  <th className="ff-sticky-team px-3 py-3 sm:px-4">Owner</th>
                  <th className="px-4 py-3 text-right">W-L-T</th>
                  <th className="px-4 py-3 text-right">PF</th>
                  <th className="px-4 py-3 text-right">PA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {standings.map((row, idx) => {
                  const owner = row.owner;
                  const name = owner?.display_name ?? "Unknown";
                  const rank = row.rank || idx + 1;
                  return (
                    <tr key={row.id}>
                      <td className="ff-sticky-rank px-3 py-3 font-mono font-bold sm:px-4">
                        {rank}
                      </td>
                      <td className="ff-sticky-team px-3 py-3 sm:px-4">
                        <div className="flex items-center gap-2">
                          <OwnerAvatar name={name} size="sm" />
                          <span className="ff-display text-sm">{name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold tabular-nums">
                        {formatRecord(row.wins, row.losses, row.ties)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                        {row.points_for.toFixed(1)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                        {row.points_against.toFixed(1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ScrollableTable>
        )}
        {standings.every((s) => s.wins === 0 && s.losses === 0 && s.ties === 0) &&
          standings.every((s) => s.points_for === 0) && (
          <p className="mt-2 text-xs text-muted-foreground">
            Current season · 0-0-0 until Week 1 scores sync from Sleeper.
          </p>
        )}
      </section>
    </div>
  );
}

function EmptyCard({ message }: { message: string }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-border bg-white p-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
