import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { DraftCountdown } from "@/components/home/draft-countdown";
import { PrimetimeSlate } from "@/components/home/primetime-slate";
import { getPublicLeagueData } from "@/lib/data/league";
import { getAuthUser } from "@/lib/auth/session";
import { getPrimetimeSlate } from "@/lib/nfl/primetime";
import { DEFAULT_DRAFT_AT } from "@/lib/types";

/**
 * Public homepage — minimal landing until sign-in.
 * Signed-in users go to the private dashboard hub.
 * After draft_at → THIS WEEK · PRIMETIME; before → draft countdown.
 */
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [{ league }, user] = await Promise.all([
    getPublicLeagueData(),
    getAuthUser(),
  ]);

  // Full league experience lives behind auth
  if (user) {
    redirect("/dashboard");
  }

  const draftAt = league.draft_at || DEFAULT_DRAFT_AT;
  const draftMs = new Date(draftAt).getTime();
  const draftPassed =
    Number.isFinite(draftMs) && Date.now() > draftMs;

  const primetime = draftPassed ? await getPrimetimeSlate() : null;

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SiteHeader league={league} isAuthenticated={false} minimal />

      <main className="relative flex flex-1 flex-col">
        <div className="flex flex-1 flex-col items-center justify-center py-10 sm:py-14">
          <div className="ff-page w-full">
            {draftPassed && primetime ? (
              <PrimetimeSlate
                games={primetime.games}
                week={primetime.week}
                hero
              />
            ) : (
              <DraftCountdown
                draftAt={draftAt}
                hero
                leagueName={league.name || "Upper Deckcers"}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
