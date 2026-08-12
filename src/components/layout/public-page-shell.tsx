import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { getLeagueSettings } from "@/lib/data/league";
import { getAuthUser } from "@/lib/auth/session";

/** Shared shell for public info pages (history, badges, constitution). */
export async function PublicPageShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [league, user] = await Promise.all([
    getLeagueSettings(),
    getAuthUser(),
  ]);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SiteHeader league={league} isAuthenticated={Boolean(user)} />
      <main className="flex-1">
        <div className="ff-page py-8 sm:py-10">{children}</div>
      </main>
      <SiteFooter league={league} />
    </div>
  );
}
