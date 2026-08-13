import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { DraftCountdown } from "@/components/home/draft-countdown";
import { getPublicLeagueData } from "@/lib/data/league";
import { getAuthUser } from "@/lib/auth/session";
import { DEFAULT_DRAFT_AT } from "@/lib/types";

/**
 * Public homepage — minimal landing until sign-in.
 * Signed-in users go to the private dashboard hub.
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

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SiteHeader league={league} isAuthenticated={false} minimal />

      <main className="relative flex flex-1 flex-col">
        {/* Center countdown in remaining viewport under sticky nav */}
        <div className="flex flex-1 flex-col items-center justify-center py-10 sm:py-14">
          <div className="ff-page w-full">
            <DraftCountdown
              draftAt={draftAt}
              hero
              leagueName={league.name || "Upper Deckcers"}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
