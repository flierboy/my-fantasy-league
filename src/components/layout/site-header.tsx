import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/components/auth/sign-out-button";
import type { LeagueSettings } from "@/lib/types";

interface SiteHeaderProps {
  league: LeagueSettings;
  /** Show "Sign in" vs "Dashboard" depending on session. */
  isAuthenticated?: boolean;
  /** When true, show Sign out next to Dashboard (private shell). */
  showSignOut?: boolean;
}

export function SiteHeader({
  league,
  isAuthenticated = false,
  showSignOut = false,
}: SiteHeaderProps) {
  return (
    <>
      <div className="ff-top-stripe" />
      <header className="ff-nav sticky top-0 z-40">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-foreground bg-white text-xl">
              🏈
            </div>
            <div className="leading-tight min-w-0">
              <p className="ff-display truncate text-base sm:text-lg">
                {league.name}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {league.tagline}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="live">Live</Badge>
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="inline-flex h-9 items-center rounded-lg border-2 border-foreground bg-foreground px-3 text-xs font-bold uppercase tracking-wide text-background hover:bg-neutral-800"
                >
                  Dashboard
                </Link>
                {showSignOut && <SignOutButton />}
              </>
            ) : (
              <Link
                href="/login"
                className="inline-flex h-9 items-center rounded-lg border-2 border-foreground bg-foreground px-3 text-xs font-bold uppercase tracking-wide text-background hover:bg-neutral-800"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
