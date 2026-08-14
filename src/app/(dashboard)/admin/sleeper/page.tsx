import { SleeperSyncForm } from "@/components/admin/sleeper-sync-form";
import { SLEEPER_DEFAULT_LEAGUE_ID } from "@/lib/sleeper/client";
import { getLeagueSettings } from "@/lib/data/league";

export const metadata = {
  title: "Admin · Sleeper",
};

export default async function AdminSleeperPage() {
  const league = await getLeagueSettings();
  const autoAward = league.auto_award_weekly_badges !== false;

  return (
    <div className="space-y-6">
      <header>
        <p className="ff-ribbon">Sleeper</p>
        <h1 className="ff-display mt-2 text-3xl tracking-tight">
          Sleeper sync
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Pull league name, users/teams, and standings from Sleeper league{" "}
          <code className="font-mono text-xs">{SLEEPER_DEFAULT_LEAGUE_ID}</code>
          . Also awards weekly badges and can email Week X Results once the
          season is underway.
        </p>
      </header>

      <SleeperSyncForm autoAwardDefault={autoAward} />
    </div>
  );
}
