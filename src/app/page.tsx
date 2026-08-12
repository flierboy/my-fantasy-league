import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { HeroSection } from "@/components/home/hero-section";
import { TrophySection } from "@/components/home/trophy-section";
import { DraftCountdown } from "@/components/home/draft-countdown";
import { OwnersGrid } from "@/components/home/owners-grid";
import { DraftOrder } from "@/components/home/draft-order";
import { getPublicLeagueData } from "@/lib/data/league";
import { getAuthUser } from "@/lib/auth/session";
import { DEFAULT_DRAFT_AT } from "@/lib/types";

/**
 * Public homepage — no auth required.
 */
export const dynamic = "force-dynamic";

const HOME_LINKS = [
  { href: "/history", icon: "📜", title: "History", blurb: "Trophy wall & records" },
  { href: "/badges", icon: "🎖️", title: "Badges", blurb: "Hall of glory & shame" },
  { href: "/constitution", icon: "📖", title: "Constitution", blurb: "League rules" },
];

export default async function HomePage() {
  const [{ league, owners }, user] = await Promise.all([
    getPublicLeagueData(),
    getAuthUser(),
  ]);

  const draftAt = league.draft_at || DEFAULT_DRAFT_AT;

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader league={league} isAuthenticated={Boolean(user)} />

      <main className="flex-1">
        <div className="ff-page flex flex-col gap-12 py-10 sm:gap-14 sm:py-14">
          <HeroSection league={league} />

          {/* Always rendered — uses DEFAULT_DRAFT_AT if DB column missing */}
          <DraftCountdown draftAt={draftAt} />

          <section>
            <div className="mb-4 text-center sm:text-left">
              <p className="ff-ribbon">League info</p>
              <h2 className="ff-display mt-2.5 text-2xl tracking-tight sm:text-3xl">
                Explore
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {HOME_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="ff-hub-tile">
                  <span className="ff-hub-icon" aria-hidden>
                    {link.icon}
                  </span>
                  <span>{link.title}</span>
                  <span className="ff-hub-blurb">{link.blurb}</span>
                </Link>
              ))}
            </div>
          </section>

          <TrophySection league={league} />
          <OwnersGrid owners={owners} />
          <DraftOrder owners={owners} />
        </div>
      </main>

      <SiteFooter league={league} />
    </div>
  );
}
