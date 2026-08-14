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
          Weekly ops for league{" "}
          <code className="font-mono text-xs">{SLEEPER_DEFAULT_LEAGUE_ID}</code>
          : users/rosters, season standings, matchups for a week, optional
          badges + results email.
        </p>
      </header>

      <SleeperSyncForm
        autoAwardDefault={autoAward}
        lastSyncAt={league.last_sleeper_sync_at ?? null}
      />
    </div>
  );
}
