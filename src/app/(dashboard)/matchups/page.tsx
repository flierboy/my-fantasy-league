import { getMatchupsData } from "@/lib/data/dashboard";
import { formatRecord } from "@/lib/utils";
import { OwnerAvatar } from "@/components/home/owner-avatar";

export const metadata = {
  title: "Matchups",
};

export default async function MatchupsPage() {
  const { matchups, standings, season, week, source } =
    await getMatchupsData();

  // Group matchups by week (latest first)
  const byWeek = new Map<number, typeof matchups>();
  for (const m of matchups) {
    const list = byWeek.get(m.week) ?? [];
    list.push(m);
    byWeek.set(m.week, list);
  }
  const weeks = [...byWeek.keys()].sort((a, b) => b - a);
  const displayWeek = week ?? weeks[0] ?? null;
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
          {source === "supabase" ? " · live from Supabase" : " · local fallback"}
          {matchups.length === 0 &&
            " · no matchups entered yet (admin can add them in Table Editor)"}
        </p>
      </header>

      <section>
        <h2 className="ff-display mb-3 text-xl">
          {displayWeek != null ? `Week ${displayWeek}` : "This week"}
        </h2>
        {weekMatchups.length === 0 ? (
          <EmptyCard message="No matchups for this week yet. Add rows to the matchups table in Supabase." />
        ) : (
          <div className="space-y-3">
            {weekMatchups.map((m) => {
              const home = m.home_owner;
              const away = m.away_owner;
              return (
                <div
                  key={m.id}
                  className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl border-2 border-foreground bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center gap-2 justify-end text-right">
                    <div className="min-w-0">
                      <p className="ff-display truncate text-sm">
                        {home?.display_name ?? "TBD"}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {m.home_score != null
                          ? m.home_score.toFixed(1)
                          : home
                            ? formatRecord(home.wins, home.losses)
                            : "—"}
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
                      <p className="ff-display truncate text-sm">
                        {away?.display_name ?? "TBD"}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {m.away_score != null
                          ? m.away_score.toFixed(1)
                          : away
                            ? formatRecord(away.wins, away.losses)
                            : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {weeks.length > 1 && (
        <section>
          <h2 className="ff-display mb-3 text-xl">All weeks</h2>
          <div className="flex flex-wrap gap-2">
            {weeks.map((w) => (
              <span
                key={w}
                className="rounded-lg border-2 border-foreground bg-white px-3 py-1 text-xs font-bold uppercase"
              >
                W{w} · {byWeek.get(w)?.length ?? 0} games
              </span>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="ff-display mb-3 text-xl">Standings</h2>
        <div className="overflow-hidden rounded-xl border-2 border-foreground bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b-2 border-foreground bg-[#f4f2ef] text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3 text-right">W-L</th>
                <th className="hidden px-4 py-3 text-right sm:table-cell">
                  PF
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {standings.map((row, idx) => {
                const owner = row.owner;
                const name = owner?.display_name ?? "Unknown";
                return (
                  <tr key={row.id}>
                    <td className="px-4 py-3 font-mono font-bold">
                      {row.rank || idx + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <OwnerAvatar name={name} size="sm" />
                        <span className="ff-display text-sm">{name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold tabular-nums">
                      {formatRecord(row.wins, row.losses, row.ties)}
                    </td>
                    <td className="hidden px-4 py-3 text-right font-mono text-muted-foreground sm:table-cell">
                      {row.points_for > 0 ? row.points_for.toFixed(1) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {standings[0]?.id.startsWith("fallback-") && (
          <p className="mt-2 text-xs text-muted-foreground">
            Showing franchise all-time W-L until season standings rows exist.
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
