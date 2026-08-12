import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { getLeagueSettings } from "@/lib/data/league";
import { getSessionContext } from "@/lib/auth/session";

/**
 * Shell for all private (login-required) pages.
 * Middleware enforces auth when Supabase env vars are set.
 */
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [league, { owner, isAdmin }] = await Promise.all([
    getLeagueSettings(),
    getSessionContext(),
  ]);

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader league={league} isAuthenticated showSignOut />
      <DashboardNav showAdmin={isAdmin} />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
          {owner && (
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Signed in as{" "}
              <span className="text-foreground">{owner.display_name}</span>
              {isAdmin && (
                <span className="ml-2 rounded-full border border-foreground px-1.5 py-0.5 text-[10px]">
                  Admin
                </span>
              )}
            </p>
          )}
          {!owner && (
            <div className="mb-4 rounded-lg border-2 border-amber-600/40 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              Your account is not linked to an owner yet. Ask the commissioner to
              set <code className="font-mono text-xs">owners.user_id</code> to
              your auth user id.
            </div>
          )}
          {children}
        </div>
      </main>

      <footer className="border-t border-border py-3 text-center text-xs text-muted-foreground">
        <Link href="/" className="font-semibold hover:underline">
          ← Public homepage
        </Link>
      </footer>
      <SiteFooter league={league} />
    </div>
  );
}
