import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicPageShell } from "@/components/layout/public-page-shell";
import { getLeagueSettings, getOwners } from "@/lib/data/league";
import {
  buildCareerFranchiseStats,
  getCurrentSeasonStandingsByOwner,
  getPastSeasons,
  ownerSeasonFinishes,
} from "@/lib/data/seasons";
import { getPunishments } from "@/lib/data/punishments";
import { OwnerAvatar } from "@/components/home/owner-avatar";
import { OwnerBadge } from "@/components/home/owner-badge";
import { MoneyChip } from "@/components/home/money-chip";
import { formatPoints, formatRecord, formatWinPct } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const owners = await getOwners();
  const owner = owners.find((o) => o.id === id);
  return {
    title: owner ? owner.display_name : "Owner",
  };
}

export default async function OwnerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [owners, { seasons }, { punishments }, league] = await Promise.all([
    getOwners(),
    getPastSeasons({ withStandings: true }),
    getPunishments({ ownerId: id }),
    getLeagueSettings(),
  ]);

  const owner = owners.find((o) => o.id === id);
  if (!owner) notFound();

  const currentByOwner = await getCurrentSeasonStandingsByOwner(
    league.season_year
  );
  const career = buildCareerFranchiseStats(owners, seasons, {
    currentByOwner,
    currentSeasonYear: league.season_year,
  });
  const c = career.get(owner.id)!;

  const finishes = ownerSeasonFinishes(seasons, owner.id);
  const championships = finishes.filter((f) => f.is_champion);
  const runnerUps = finishes.filter((f) => f.is_runner_up);

  const showPfPa = !c.from_owner_fallback || c.points_for > 0 || c.points_against > 0;

  return (
    <PublicPageShell>
      <div className="space-y-8">
        <p className="text-sm">
          <Link
            href="/players"
            className="font-bold text-muted-foreground hover:text-foreground hover:underline"
          >
            ← All players
          </Link>
        </p>

        <header className="ff-welcome">
          <div className="ff-top-stripe" />
          <div className="flex flex-col items-center gap-5 px-5 py-8 text-center sm:flex-row sm:items-start sm:px-7 sm:text-left">
            <OwnerAvatar
              name={owner.display_name}
              src={owner.avatar_url}
              size="xl"
            />
            <div className="min-w-0 flex-1">
              <p className="ff-ribbon text-[10px] !px-3 !py-1">Owner profile</p>
              <h1 className="ff-display mt-3 text-3xl tracking-tight sm:text-4xl">
                {owner.display_name}
              </h1>
              {owner.team_name && (
                <p className="mt-1 text-sm font-semibold text-muted-foreground">
                  {owner.team_name}
                </p>
              )}
              {owner.role && (
                <span className="mt-2 inline-flex rounded-full border-2 border-foreground bg-[var(--banner)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                  {owner.role}
                </span>
              )}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                <p className="font-mono text-lg font-bold tabular-nums">
                  {formatRecord(c.wins, c.losses, c.ties)}
                </p>
                <span className="font-mono text-sm font-bold tabular-nums text-muted-foreground">
                  {formatWinPct(c.wins, c.losses, c.ties)}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Career
                </span>
                <MoneyChip amount={owner.prize_money} />
                {owner.favorite_nfl_team && (
                  <span className="rounded-full border-2 border-border bg-white px-2.5 py-1 text-xs font-bold">
                    NFL · {owner.favorite_nfl_team}
                  </span>
                )}
              </div>
              {showPfPa && (
                <div className="mt-3 flex flex-wrap items-center justify-center gap-4 sm:justify-start">
                  <StatPill label="PF" value={formatPoints(c.points_for)} />
                  <StatPill label="PA" value={formatPoints(c.points_against)} />
                  {c.seasons_played > 0 && (
                    <StatPill
                      label="Seasons"
                      value={String(c.seasons_played)}
                    />
                  )}
                </div>
              )}
              {owner.badges.length > 0 && (
                <div className="mt-4 flex flex-wrap justify-center gap-1.5 sm:justify-start">
                  {owner.badges.map((b) => (
                    <OwnerBadge key={b} badgeKey={b} showLabel />
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Championships / podium */}
        <section className="grid gap-3 sm:grid-cols-2">
          <div className="ff-card p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Championships
            </p>
            {championships.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                No rings yet. Still hunting.
              </p>
            ) : (
              <ul className="mt-2 space-y-1">
                {championships.map((ch) => (
                  <li key={ch.season_year} className="ff-display text-lg">
                    🏆 {ch.season_year}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="ff-card p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Runner-up finishes
            </p>
            {runnerUps.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">None.</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {runnerUps.map((ru) => (
                  <li key={ru.season_year} className="ff-display text-lg">
                    🥈 {ru.season_year}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Season finishes */}
        <section>
          <p className="ff-ribbon text-[10px] !px-3 !py-1">Seasons</p>
          <h2 className="ff-display mt-2.5 text-2xl">Season finishes</h2>
          {finishes.length === 0 ? (
            <p className="ff-card mt-4 p-5 text-sm text-muted-foreground">
              No past-season standings linked yet. Admins can add them under
              Admin → Past seasons.
            </p>
          ) : (
            <div className="ff-card mt-4 overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead className="border-b-2 border-foreground bg-[#f4f2ef] text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-3 sm:px-4">Year</th>
                    <th className="px-3 py-3 sm:px-4">Finish</th>
                    <th className="px-3 py-3 sm:px-4">W-L-T</th>
                    <th className="px-3 py-3 text-right sm:px-4">Win%</th>
                    <th className="px-3 py-3 text-right sm:px-4">PF</th>
                    <th className="px-3 py-3 text-right sm:px-4">PA</th>
                    <th className="hidden px-3 py-3 sm:table-cell sm:px-4">
                      Team
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {finishes.map((f) => (
                    <tr
                      key={f.season_year}
                      className={
                        f.is_champion
                          ? "bg-amber-50/80"
                          : f.is_runner_up
                            ? "bg-zinc-50"
                            : undefined
                      }
                    >
                      <td className="px-3 py-3 font-mono font-bold sm:px-4">
                        {f.season_year}
                      </td>
                      <td className="px-3 py-3 font-bold sm:px-4">
                        #{f.rank}
                        {f.is_champion ? " 🏆" : ""}
                        {f.is_runner_up && !f.is_champion ? " 🥈" : ""}
                      </td>
                      <td className="px-3 py-3 font-mono tabular-nums sm:px-4">
                        {formatRecord(f.wins, f.losses, f.ties)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono tabular-nums sm:px-4">
                        {formatWinPct(f.wins, f.losses, f.ties)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono tabular-nums sm:px-4">
                        {formatPoints(f.points_for)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono tabular-nums text-muted-foreground sm:px-4">
                        {formatPoints(f.points_against)}
                      </td>
                      <td className="hidden px-3 py-3 text-muted-foreground sm:table-cell sm:px-4">
                        {f.team_name || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Punishments */}
        <section>
          <p className="ff-ribbon text-[10px] !px-3 !py-1">Consequences</p>
          <h2 className="ff-display mt-2.5 text-2xl">Punishments</h2>
          {punishments.length === 0 ? (
            <p className="ff-card mt-4 p-5 text-sm text-muted-foreground">
              Clean record. For now.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {punishments.map((p) => (
                <li key={p.id} className="ff-card p-4 sm:p-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {p.season_year} · {p.title}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed">{p.description}</p>
                  {p.photo_url && (
                    <a
                      href={p.photo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-xs font-bold underline"
                    >
                      Photo / evidence →
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Full wall:{" "}
            <Link href="/punishments" className="font-bold underline">
              /punishments
            </Link>
          </p>
        </section>
      </div>
    </PublicPageShell>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border-2 border-border bg-white px-3 py-1.5 text-left shadow-sm">
      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="font-mono text-sm font-bold tabular-nums">{value}</p>
    </div>
  );
}
