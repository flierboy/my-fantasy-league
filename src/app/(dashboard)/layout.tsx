import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { getLeagueSettings } from "@/lib/data/league";
import { getSessionContext } from "@/lib/auth/session";

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
        <div className="ff-page py-8 sm:py-10">
          {owner && (
            <div className="mb-5 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              Signed in as{" "}
              <span className="text-foreground">{owner.display_name}</span>
              {isAdmin && (
                <span className="rounded-full border-2 border-foreground bg-[var(--accent-gold)] px-2 py-0.5 text-[10px] text-foreground">
                  Admin
                </span>
              )}
            </div>
          )}
          {!owner && (
            <div className="ff-card mb-5 border-amber-700/50 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              Your account is not linked to an owner yet. Ask the commissioner to
              set <code className="font-mono text-xs">owners.user_id</code> to
              your auth user id.
            </div>
          )}
          {children}
        </div>
      </main>

      <div className="border-t-2 border-white/15 bg-black/25 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white/85">
        <Link href="/" className="hover:text-white hover:underline">
          ← Public homepage
        </Link>
      </div>
      <SiteFooter league={league} />
    </div>
  );
}
