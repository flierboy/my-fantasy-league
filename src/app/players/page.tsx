import { PublicPageShell } from "@/components/layout/public-page-shell";
import { PlayersView } from "@/components/home/players-view";
import { getOwners, getLeagueSettings } from "@/lib/data/league";
import {
  buildCareerFranchiseStats,
  getCurrentSeasonStandingsByOwner,
  getPastSeasons,
  type CareerFranchiseStats,
} from "@/lib/data/seasons";

export const metadata = {
  title: "Players",
};

export const dynamic = "force-dynamic";

/**
 * Public Players / Owners page — centerpiece roster cards.
 */
export default async function PlayersPage() {
  const [owners, league, { seasons }] = await Promise.all([
    getOwners(),
    getLeagueSettings(),
    getPastSeasons({ withStandings: true }),
  ]);

  const currentByOwner = await getCurrentSeasonStandingsByOwner(
    league.season_year
  );
  const careerMap = buildCareerFranchiseStats(owners, seasons, {
    currentByOwner,
    currentSeasonYear: league.season_year,
  });

  // Serialize Map for client component props
  const careerByOwner: Record<string, CareerFranchiseStats> = {};
  for (const [id, stats] of careerMap) {
    careerByOwner[id] = stats;
  }

  return (
    <PublicPageShell>
      <div className="space-y-8">
        <header className="ff-welcome">
          <div className="ff-top-stripe" />
          <div className="px-5 py-6 sm:px-7">
            <p className="ff-ribbon text-[10px] !px-3 !py-1">Roster</p>
            <h1 className="ff-display mt-3 text-3xl tracking-tight sm:text-4xl">
              Players
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              {league.name} owners — photos, teams, roles, career Win% / PF /
              PA, cash, and badges. {owners.length} franchise
              {owners.length === 1 ? "" : "s"} in the book.
            </p>
          </div>
        </header>

        <PlayersView
          owners={owners}
          careerByOwner={careerByOwner}
          showHeader={false}
          defaultView="grid"
        />
      </div>
    </PublicPageShell>
  );
}
