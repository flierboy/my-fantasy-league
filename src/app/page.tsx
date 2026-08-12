import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { HeroSection } from "@/components/home/hero-section";
import { TrophySection } from "@/components/home/trophy-section";
import { OwnersGrid } from "@/components/home/owners-grid";
import { DraftOrder } from "@/components/home/draft-order";
import { getPublicLeagueData } from "@/lib/data/league";
import { getAuthUser } from "@/lib/auth/session";

/**
 * Public homepage — no auth required.
 * Loads league settings + owners from Supabase (with placeholder fallback).
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
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 py-10 sm:px-6 sm:py-14">
          <HeroSection league={league} />
          <TrophySection league={league} />
          <OwnersGrid owners={owners} />
          <DraftOrder owners={owners} />
        </div>
      </main>

      <SiteFooter league={league} />
    </div>
  );
}
