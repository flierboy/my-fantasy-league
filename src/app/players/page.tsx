import { PublicPageShell } from "@/components/layout/public-page-shell";
import { PlayersView } from "@/components/home/players-view";
import { getOwners, getLeagueSettings } from "@/lib/data/league";
import { buildCareerFranchiseStats } from "@/lib/data/seasons";
import { getPastSeasons } from "@/lib/data/seasons";

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

  const withCareer = buildCareerFranchiseStats(owners, seasons);

  return (
    <PublicPageShell>
      <div className="space-y-8">
        <header>
          <p className="ff-ribbon text-[10px] !px-3 !py-1">Roster</p>
          <h1 className="ff-display mt-2.5 text-3xl tracking-tight sm:text-4xl">
            Players
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {league.name} owners — photos, teams, roles, franchise W-L, career
            PF/PA, cash, and badges. {owners.length} franchise
            {owners.length === 1 ? "" : "s"} in the book.
          </p>
        </header>

        <PlayersView
          owners={withCareer}
          showHeader={false}
          defaultView="grid"
        />
      </div>
    </PublicPageShell>
  );
}
