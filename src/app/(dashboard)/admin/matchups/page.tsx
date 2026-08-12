import { getMatchupsData } from "@/lib/data/dashboard";
import { MatchupsManager } from "@/components/admin/matchups-manager";

export const metadata = {
  title: "Admin · Matchups",
};

export default async function AdminMatchupsPage() {
  const data = await getMatchupsData();

  return (
    <div className="space-y-6">
      <header>
        <p className="ff-ribbon">Scores</p>
        <h1 className="ff-display mt-2 text-3xl tracking-tight">
          Matchups & standings
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Add weekly matchups, enter scores, and maintain season standings for{" "}
          {data.season}.
        </p>
      </header>
      <MatchupsManager
        league={data.league}
        owners={data.owners}
        matchups={data.matchups}
        standings={data.standings.filter((s) => !s.id.startsWith("fallback-"))}
        season={data.season}
      />
    </div>
  );
}
