import Link from "next/link";
import { PublicPageShell } from "@/components/layout/public-page-shell";
import { getLeagueSettings, getOwners } from "@/lib/data/league";
import { ALL_TIME_BLURB, getHistoryEntries, groupHistory } from "@/lib/data/history";
import {
  buildCareerFranchiseStats,
  getCurrentSeasonStandingsByOwner,
  getPastSeasons,
} from "@/lib/data/seasons";
import { formatPoints, formatRecord, formatWinPct } from "@/lib/utils";
import { OwnerAvatar } from "@/components/home/owner-avatar";
import { ScrollableTable } from "@/components/ui/scrollable-table";

export const metadata = {
  title: "History",
};

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const [{ entries, source }, owners, { seasons }, league] = await Promise.all([
    getHistoryEntries(),
    getOwners(),
    getPastSeasons({ withStandings: true }),
    getLeagueSettings(),
  ]);

  const { champions, milestones, records, notes } = groupHistory(entries);

  const currentByOwner = await getCurrentSeasonStandingsByOwner(
    league.season_year
  );
  const career = buildCareerFranchiseStats(owners, seasons, {
    currentByOwner,
    currentSeasonYear: league.season_year,
  });

  const sorted = [...owners].sort((a, b) => {
    const ca = career.get(a.id)!;
    const cb = career.get(b.id)!;
    if (cb.wins !== ca.wins) return cb.wins - ca.wins;
    if (ca.losses !== cb.losses) return ca.losses - cb.losses;
    if (cb.points_for !== ca.points_for) return cb.points_for - ca.points_for;
    return a.sort_order - b.sort_order;
  });

  return (
    <PublicPageShell>
      <div className="space-y-10">
        <header className="ff-welcome">
          <div className="ff-top-stripe" />
          <div className="px-5 py-6 sm:px-7">
            <p className="ff-ribbon text-[10px] !px-3 !py-1">Legacy</p>
            <h1 className="ff-display mt-3 text-3xl tracking-tight sm:text-4xl">
              League history
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Champions, scars, and the long road to the hardware. {ALL_TIME_BLURB}
            </p>
            {source === "placeholder" && (
              <p className="mt-3 text-xs font-semibold text-muted-foreground">
                History will fill in as seasons are recorded.
              </p>
            )}
            {source === "supabase" && entries.length === 0 && seasons.length === 0 && (
              <p className="mt-3 text-xs font-semibold text-muted-foreground">
                No history entries yet — check back after a few seasons of
                glory (and shame).
              </p>
            )}
          </div>
        </header>

        {/* Past season standings tables */}
        {seasons.length > 0 && (
          <section className="space-y-8">
            <div>
              <p className="ff-ribbon text-[10px] !px-3 !py-1">Past seasons</p>
              <h2 className="ff-display mt-2.5 text-2xl">Season standings</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Full tables by year — champions highlighted.{" "}
                <Link href="/drafts" className="font-bold underline">
                  Draft boards →
                </Link>
                {" · "}
                <Link href="/punishments" className="font-bold underline">
                  Wall of Shame →
                </Link>
              </p>
            </div>
            {seasons.map((season) => {
              const rows = [...(season.standings ?? [])].sort(
                (a, b) => a.rank - b.rank
              );
              return (
                <div key={season.id} className="space-y-3">
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <div>
                      <h3 className="ff-display text-xl tracking-tight">
                        {season.label || season.season_year}
                      </h3>
                      {(season.champion || season.runner_up) && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {season.champion && (
                            <span>
                              🏆{" "}
                              {season.champion_owner_id ? (
                                <Link
                                  href={`/players/${season.champion_owner_id}`}
                                  className="font-bold underline"
                                >
                                  {season.champion.display_name}
                                </Link>
                              ) : (
                                season.champion.display_name
                              )}
                            </span>
                          )}
                          {season.runner_up && (
                            <span className="ml-3">
                              🥈{" "}
                              {season.runner_up_owner_id ? (
                                <Link
                                  href={`/players/${season.runner_up_owner_id}`}
                                  className="font-semibold underline"
                                >
                                  {season.runner_up.display_name}
                                </Link>
                              ) : (
                                season.runner_up.display_name
                              )}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  {season.recap_notes && (
                    <p className="ff-card p-4 text-sm leading-relaxed text-muted-foreground">
                      {season.recap_notes}
                    </p>
                  )}
                  {rows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No standings rows for this season yet.
                    </p>
                  ) : (
                    <ScrollableTable
                      minWidth="34rem"
                      hint="Swipe for Win% · PF · PA"
                    >
                      <table className="w-full text-sm">
                        <thead className="border-b-2 border-foreground bg-[#f4f2ef] text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          <tr>
                            <th className="ff-sticky-rank px-3 py-3 sm:px-4">
                              #
                            </th>
                            <th className="ff-sticky-team px-3 py-3 sm:px-4">
                              Team / owner
                            </th>
                            <th className="px-3 py-3 text-right sm:px-4">
                              W-L-T
                            </th>
                            <th className="px-3 py-3 text-right sm:px-4">
                              Win%
                            </th>
                            <th className="px-3 py-3 text-right sm:px-4">
                              PF
                            </th>
                            <th className="px-3 py-3 text-right sm:px-4">
                              PA
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {rows.map((row) => {
                            const name =
                              row.owner?.display_name ||
                              row.team_name ||
                              "—";
                            // Hardware only for explicit champ / runner-up — never every row
                            const champ =
                              row.is_champion === true ||
                              (Boolean(season.champion_owner_id) &&
                                row.owner_id === season.champion_owner_id);
                            const runnerUp =
                              !champ &&
                              (row.is_runner_up === true ||
                                (Boolean(season.runner_up_owner_id) &&
                                  row.owner_id === season.runner_up_owner_id));
                            return (
                              <tr
                                key={row.id}
                                className={
                                  champ
                                    ? "bg-amber-50/90"
                                    : runnerUp
                                      ? "bg-zinc-50"
                                      : undefined
                                }
                              >
                                <td className="ff-sticky-rank px-3 py-3 font-mono font-bold sm:px-4">
                                  {row.rank}
                                  {champ ? " 🏆" : ""}
                                  {runnerUp ? " 🥈" : ""}
                                </td>
                                <td className="ff-sticky-team px-3 py-3 sm:px-4">
                                  <div className="flex items-center gap-2">
                                    {row.owner && (
                                      <OwnerAvatar
                                        name={name}
                                        src={row.owner.avatar_url}
                                        size="sm"
                                      />
                                    )}
                                    <div className="min-w-0">
                                      {row.owner_id ? (
                                        <Link
                                          href={`/players/${row.owner_id}`}
                                          className="ff-display text-sm hover:underline"
                                        >
                                          {name}
                                        </Link>
                                      ) : (
                                        <span className="ff-display text-sm">
                                          {name}
                                        </span>
                                      )}
                                      {row.team_name &&
                                        row.team_name !== name && (
                                          <p className="truncate text-[11px] text-muted-foreground">
                                            {row.team_name}
                                          </p>
                                        )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 py-3 text-right font-mono font-bold tabular-nums sm:px-4">
                                  {formatRecord(
                                    row.wins,
                                    row.losses,
                                    row.ties
                                  )}
                                </td>
                                <td className="px-3 py-3 text-right font-mono tabular-nums sm:px-4">
                                  {formatWinPct(
                                    row.wins,
                                    row.losses,
                                    row.ties
                                  )}
                                </td>
                                <td className="px-3 py-3 text-right font-mono tabular-nums sm:px-4">
                                  {formatPoints(row.points_for)}
                                </td>
                                <td className="px-3 py-3 text-right font-mono tabular-nums text-muted-foreground sm:px-4">
                                  {formatPoints(row.points_against)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </ScrollableTable>
                  )}
                </div>
              );
            })}
          </section>
        )}

        {/* Champions / trophy wall */}
        <section>
          <p className="ff-ribbon text-[10px] !px-3 !py-1">The hardware</p>
          <h2 className="ff-display mt-2.5 text-2xl">Trophy wall</h2>
          {champions.length === 0 ? (
            <p className="ff-card mt-4 p-5 text-sm text-muted-foreground">
              No champions recorded yet.
            </p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {champions.map((c) => (
                <article key={c.id} className="ff-card p-5 sm:p-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    {c.year_label}
                    {c.season_year ? ` · ${c.season_year}` : ""}
                  </p>
                  <p className="ff-display mt-2 text-2xl tracking-tight">
                    🏆 {c.champion || c.title}
                  </p>
                  {c.runner_up && (
                    <p className="mt-1 text-sm font-semibold text-muted-foreground">
                      Runner-up · {c.runner_up}
                    </p>
                  )}
                  {c.title && c.champion && (
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {c.title}
                    </p>
                  )}
                  {c.notes && (
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {c.notes}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Milestones */}
        <section>
          <p className="ff-ribbon text-[10px] !px-3 !py-1">Timeline</p>
          <h2 className="ff-display mt-2.5 text-2xl">Milestones</h2>
          {milestones.length === 0 ? (
            <p className="ff-card mt-4 p-5 text-sm text-muted-foreground">
              No milestones yet.
            </p>
          ) : (
            <ol className="ff-card mt-4 divide-y-2 divide-border overflow-hidden">
              {milestones.map((m) => (
                <li
                  key={m.id}
                  className="flex gap-4 px-4 py-4 sm:px-5"
                >
                  <span className="ff-display flex h-12 w-14 shrink-0 items-center justify-center rounded-lg border-2 border-foreground bg-[#f4f2ef] text-xs shadow-[2px_2px_0_0_#141414]">
                    {m.year_label}
                  </span>
                  <div>
                    <p className="ff-display text-base">{m.title}</p>
                    {m.notes && (
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {m.notes}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Records / stats */}
        <section>
          <p className="ff-ribbon text-[10px] !px-3 !py-1">Stats</p>
          <h2 className="ff-display mt-2.5 text-2xl">All-time records</h2>
          {records.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              No custom record entries yet. Franchise W-L is listed below.
            </p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {records.map((r) => (
                <article key={r.id} className="ff-card p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    {r.year_label}
                  </p>
                  <p className="ff-display mt-1.5 text-lg">{r.title}</p>
                  {r.champion && (
                    <p className="mt-1 text-sm font-semibold">{r.champion}</p>
                  )}
                  {r.notes && (
                    <p className="mt-2 text-sm text-muted-foreground">{r.notes}</p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Free-form notes */}
        {notes.length > 0 && (
          <section>
            <p className="ff-ribbon text-[10px] !px-3 !py-1">Notes</p>
            <h2 className="ff-display mt-2.5 text-2xl">Season notes</h2>
            <div className="mt-4 space-y-3">
              {notes.map((n) => (
                <article key={n.id} className="ff-card p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    {n.year_label}
                  </p>
                  <p className="ff-display mt-1.5 text-lg">{n.title}</p>
                  {n.notes && (
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      {n.notes}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Franchise table — career from past seasons (+ current if available) */}
        <section>
          <p className="ff-ribbon text-[10px] !px-3 !py-1">Franchise</p>
          <h2 className="ff-display mt-2.5 text-2xl">Franchise standings</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            All-time from past season standings (PF / PA / Win%). Falls back to
            owner W-L when no past rows exist. Sorted by wins, then PF.
          </p>
          <ScrollableTable
            className="mt-4"
            minWidth="36rem"
            hint="Swipe for Win% · PF · PA · cash"
          >
            <table className="w-full text-sm">
              <thead className="border-b-2 border-foreground bg-[#f4f2ef] text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="ff-sticky-rank px-3 py-3 sm:px-4">#</th>
                  <th className="ff-sticky-team px-3 py-3 sm:px-4">Owner</th>
                  <th className="px-3 py-3 text-right sm:px-4">W-L-T</th>
                  <th className="px-3 py-3 text-right sm:px-4">Win%</th>
                  <th className="px-3 py-3 text-right sm:px-4">PF</th>
                  <th className="px-3 py-3 text-right sm:px-4">PA</th>
                  <th className="px-3 py-3 text-right sm:px-4">
                    Prize $
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sorted.map((owner, idx) => {
                  const c = career.get(owner.id)!;
                  return (
                    <tr key={owner.id}>
                      <td className="ff-sticky-rank px-3 py-3 font-mono font-bold sm:px-4">
                        {idx + 1}
                      </td>
                      <td className="ff-sticky-team px-3 py-3 sm:px-4">
                        <Link
                          href={`/players/${owner.id}`}
                          className="flex items-center gap-2 hover:underline"
                        >
                          <OwnerAvatar
                            name={owner.display_name}
                            src={owner.avatar_url}
                            size="sm"
                          />
                          <span className="ff-display text-sm">
                            {owner.display_name}
                          </span>
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-bold tabular-nums sm:px-4">
                        {formatRecord(c.wins, c.losses, c.ties)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono tabular-nums sm:px-4">
                        {formatWinPct(c.wins, c.losses, c.ties)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono tabular-nums sm:px-4">
                        {c.from_owner_fallback && c.points_for === 0
                          ? "—"
                          : formatPoints(c.points_for)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono tabular-nums text-muted-foreground sm:px-4">
                        {c.from_owner_fallback && c.points_against === 0
                          ? "—"
                          : formatPoints(c.points_against)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-muted-foreground sm:px-4">
                        ${owner.prize_money.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ScrollableTable>
        </section>
      </div>
    </PublicPageShell>
  );
}
