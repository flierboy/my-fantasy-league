import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import type { LeagueSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SiteHeaderProps {
  league: LeagueSettings;
  isAuthenticated?: boolean;
  showSignOut?: boolean;
  /** Logo + Sign in only (logged-out landing) */
  minimal?: boolean;
}

const PUBLIC_LINKS = [
  { href: "/players", label: "Players" },
  { href: "/history", label: "History" },
  { href: "/drafts", label: "Drafts" },
  { href: "/punishments", label: "Punishments" },
  { href: "/badges", label: "Badges" },
  { href: "/constitution", label: "Constitution" },
];

export function SiteHeader({
  league,
  isAuthenticated = false,
  showSignOut = false,
  minimal = false,
}: SiteHeaderProps) {
  return (
    <>
      <div className="ff-top-stripe" />
      <header className="ff-nav sticky top-0 z-40">
        <div className="ff-page flex items-center justify-between gap-3 py-3">
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
              {!minimal && (
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {league.tagline}
                </p>
              )}
            </div>
          </Link>

          {!minimal && (
            <nav className="hidden items-center gap-0.5 md:flex">
              {PUBLIC_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          <div className="flex shrink-0 items-center gap-2">
            {!minimal && (
              <span className="ff-live-pill hidden sm:inline-flex">Live</span>
            )}
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

        {/* Mobile public links — hidden on minimal landing */}
        {!minimal && (
          <div className="ff-page flex gap-1 overflow-x-auto border-t border-border/80 pb-2 pt-1 md:hidden">
            {PUBLIC_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </header>
    </>
  );
}
