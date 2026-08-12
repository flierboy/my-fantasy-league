import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { HeroSection } from "@/components/home/hero-section";
import { TrophySection } from "@/components/home/trophy-section";
import { DraftCountdown } from "@/components/home/draft-countdown";
import { OwnersGrid } from "@/components/home/owners-grid";
import { DraftOrder } from "@/components/home/draft-order";
import { getPublicLeagueData } from "@/lib/data/league";
import { getAuthUser } from "@/lib/auth/session";

/**
 * Public homepage — no auth required.
 */
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [{ league, owners }, user] = await Promise.all([
    getPublicLeagueData(),
    getAuthUser(),
  ]);

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader league={league} isAuthenticated={Boolean(user)} />

      <main className="flex-1">
        <div className="ff-page flex flex-col gap-12 py-10 sm:gap-14 sm:py-14">
          <HeroSection league={league} />
          <DraftCountdown draftAt={league.draft_at} />
          <TrophySection league={league} />
          <OwnersGrid owners={owners} />
          <DraftOrder owners={owners} />
        </div>
      </main>

      <SiteFooter league={league} />
    </div>
  );
}
