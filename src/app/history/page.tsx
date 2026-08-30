import Link from "next/link";
import { PublicPageShell } from "@/components/layout/public-page-shell";
import { getOwners } from "@/lib/data/league";
import {
  ALL_TIME_BLURB,
  buildTrophyWall,
  getHistoryEntries,
  groupHistory,
} from "@/lib/data/history";
import { buildCareerFranchiseStats, getPastSeasons } from "@/lib/data/seasons";
import { computeWinPct } from "@/lib/utils";
import { OwnerAvatar } from "@/components/home/owner-avatar";
import { HistoryStandingsResponsive } from "@/components/history/standings-responsive";

export const metadata = {
  title: "History",
};

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const [{ entries, source }, owners, { seasons }] = await Promise.all([
    getHistoryEntries(),
    getOwners(),
    getPastSeasons({ withStandings: true }),
  ]);

  const { champions, milestones, records, notes } = groupHistory(entries);
  const trophies = buildTrophyWall(seasons, champions);

  const withCareer = buildCareerFranchiseStats(owners, seasons);
  const sorted = [...withCareer].sort((a, b) => {
    if (b.career.w !== a.career.w) return b.career.w - a.career.w;
    const bPct = computeWinPct(b.career.w, b.career.l, b.career.t);
    const aPct = computeWinPct(a.career.w, a.career.l, a.career.t);
    if (bPct !== aPct) return bPct - aPct;
    const bpf = b.career.pf ?? 0;
    const apf = a.career.pf ?? 0;
    if (bpf !== apf) return bpf - apf;
    return a.sort_order - b.sort_order;
  });

  return (
    <PublicPageShell>
      <div className="space-y-10">
        <header>
          <p className="ff-ribbon text-[10px] !px-3 !py-1">Legacy</p>
          <h1 className="ff-display mt-2.5 text-3xl tracking-tight sm:text-4xl">
            League history
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Champions, scars, and the long road to the hardware. {ALL_TIME_BLURB}
          </p>
          {source === "placeholder" && (
            <p className="mt-2 text-xs font-semibold text-muted-foreground">
              History will fill in as seasons are recorded.
            </p>
          )}
          {source === "supabase" &&
            entries.length === 0 &&
            seasons.length === 0 && (
              <p className="mt-2 text-xs font-semibold text-muted-foreground">
                No history yet — add past seasons and champions in Admin when
                they exist. We don&apos;t invent names.
              </p>
            )}
        </header>

        {/* Trophy wall — every recorded champion, newest first */}
        <section>
          <p className="ff-ribbon text-[10px] !px-3 !py-1">The hardware</p>
          <h2 className="ff-display mt-2.5 text-2xl tracking-tight sm:text-3xl">
            Trophy wall
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Every past champion on record · newest first. Commissioners set
            champion + team name per year under Admin → Past seasons.
          </p>
          {trophies.length === 0 ? (
            <p className="ff-card mt-4 p-5 text-sm text-muted-foreground">
              No champions recorded yet. When a season ends, mark the champion
              (and their team name on the standings row) in Admin.
            </p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {trophies.map((t) => (
                <article
                  key={t.id}
                  className="ff-card relative overflow-hidden p-5 sm:p-6"
                >
                  <div
                    className="absolute right-3 top-3 text-3xl opacity-25"
                    aria-hidden
                  >
                    🏆
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    {t.year_label}
                    {t.season_year ? ` · ${t.season_year}` : ""}
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <OwnerAvatar
                      name={t.champion_name}
                      src={t.avatar_url}
                      size="md"
                    />
                    <div className="min-w-0">
                      {t.owner_id ? (
                        <Link
                          href={`/players/${t.owner_id}`}
                          className="ff-display text-xl tracking-tight hover:underline sm:text-2xl"
                        >
                          {t.champion_name}
                        </Link>
                      ) : (
                        <p className="ff-display text-xl tracking-tight sm:text-2xl">
                          {t.champion_name}
                        </p>
                      )}
                      {t.team_name && (
                        <p className="mt-0.5 text-sm font-semibold text-muted-foreground">
                          {t.team_name}
                        </p>
                      )}
                    </div>
                  </div>
                  {t.runner_up && (
                    <p className="mt-3 text-sm font-semibold text-muted-foreground">
                      Runner-up · {t.runner_up}
                    </p>
                  )}
                  {t.notes && (
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {t.notes}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        {/* ALL-TIME RECORDS — career from past_season_standings */}
        <section>
          <p className="ff-ribbon text-[10px] !px-3 !py-1">Franchise</p>
          <h2 className="ff-display mt-2.5 text-2xl tracking-tight sm:text-3xl">
            ALL-TIME RECORDS
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Career totals from past season standings (stable owner id; PF/PA
            summed only when present). Sorted by wins, then win%, then PF.
            Current season lives on{" "}
            <Link href="/dashboard" className="font-bold underline">
              Hub
            </Link>
            .
          </p>
          <HistoryStandingsResponsive
            className="mt-4"
            rows={sorted.map((owner, idx) => ({
              id: owner.id,
              rank: idx + 1,
              name: owner.display_name,
              ownerId: owner.id,
              avatarUrl: owner.avatar_url,
              teamName: owner.team_name,
              wins: owner.career.w,
              losses: owner.career.l,
              ties: owner.career.t,
              pointsFor: owner.career.pf,
              pointsAgainst: owner.career.pa,
            }))}
          />
        </section>

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
                    <HistoryStandingsResponsive
                      rows={rows.map((row) => {
                        const name =
                          row.owner?.display_name ||
                          row.team_name ||
                          "Unknown";
                        const champ =
                          row.is_champion === true ||
                          (Boolean(season.champion_owner_id) &&
                            row.owner_id === season.champion_owner_id);
                        const runnerUp =
                          !champ &&
                          (row.is_runner_up === true ||
                            (Boolean(season.runner_up_owner_id) &&
                              row.owner_id === season.runner_up_owner_id));
                        return {
                          id: row.id,
                          rank: row.rank,
                          name,
                          ownerId: row.owner_id,
                          avatarUrl: row.owner?.avatar_url ?? null,
                          teamName: row.team_name,
                          wins: row.wins,
                          losses: row.losses,
                          ties: row.ties,
                          pointsFor: row.points_for,
                          pointsAgainst: row.points_against,
                          highlight: champ
                            ? ("champ" as const)
                            : runnerUp
                              ? ("runner" as const)
                              : null,
                        };
                      })}
                    />
                  )}
                </div>
              );
            })}
          </section>
        )}

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
                <li key={m.id} className="flex gap-4 px-4 py-4 sm:px-5">
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

        {/* Custom record blurbs (not the franchise table) */}
        {records.length > 0 && (
          <section>
            <p className="ff-ribbon text-[10px] !px-3 !py-1">Stats</p>
            <h2 className="ff-display mt-2.5 text-2xl">Record book</h2>
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
          </section>
        )}

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
      </div>
    </PublicPageShell>
  );
}
