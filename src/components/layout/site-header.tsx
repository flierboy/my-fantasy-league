import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import type { LeagueSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SiteHeaderProps {
  league: LeagueSettings;
  isAuthenticated?: boolean;
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
        <div className="ff-page flex items-center justify-between gap-4 py-3">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center",
                "rounded-lg border-2 border-foreground bg-white text-xl",
                "shadow-[2px_2px_0_0_#141414]"
              )}
              aria-hidden
            >
              🏈
            </div>
            <div className="min-w-0 leading-tight">
              <p className="ff-display truncate text-base sm:text-lg">
                {league.name}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {league.tagline}
              </p>
            </div>
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            <span className="ff-live-pill hidden xs:inline-flex sm:inline-flex">
              Live
            </span>
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="inline-flex h-9 items-center rounded-lg border-2 border-foreground bg-foreground px-3 text-xs font-bold uppercase tracking-wide text-background transition-colors hover:bg-neutral-800"
                >
                  Dashboard
                </Link>
                {showSignOut && <SignOutButton />}
              </>
            ) : (
              <Link
                href="/login"
                className="inline-flex h-9 items-center rounded-lg border-2 border-foreground bg-foreground px-3 text-xs font-bold uppercase tracking-wide text-background transition-colors hover:bg-neutral-800"
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
