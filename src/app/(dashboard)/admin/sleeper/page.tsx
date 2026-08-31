import { DraftRecapEmailButton } from "@/components/admin/draft-recap-email-button";
import { SleeperSyncForm } from "@/components/admin/sleeper-sync-form";
import { OpenInSleeper } from "@/components/sleeper/open-in-sleeper";
import { resolveSleeperLeagueId } from "@/lib/sleeper/links";
import { getLeagueSettings } from "@/lib/data/league";

export const metadata = {
  title: "Admin · Sleeper",
};

export default async function AdminSleeperPage() {
  const league = await getLeagueSettings();
  const autoAward = league.auto_award_weekly_badges !== false;
  const sleeperId = resolveSleeperLeagueId(league.sleeper_league_id);

  return (
    <div className="space-y-6">
      <header>
        <p className="ff-ribbon">Sleeper</p>
        <h1 className="ff-display mt-2 text-3xl tracking-tight">
          Sleeper sync
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Weekly ops for league{" "}
          <code className="font-mono text-xs">{sleeperId}</code>
          : users/rosters, season standings, matchups for a week, optional
          badges + results email.
        </p>
        <p className="mt-3">
          <OpenInSleeper leagueId={league.sleeper_league_id} />
        </p>
      </header>

      <SleeperSyncForm
        autoAwardDefault={autoAward}
        lastSyncAt={league.last_sleeper_sync_at ?? null}
        sleeperLeagueId={league.sleeper_league_id}
      />

      <DraftRecapEmailButton />
    </div>
  );
}
