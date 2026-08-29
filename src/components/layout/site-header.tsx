"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { LeagueSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

type NavLink = {
  href: string;
  label: string;
  /** Match only exact path (e.g. Hub) */
  exact?: boolean;
  adminOnly?: boolean;
};

/** Single source of truth — every destination lives here, once. */
const NAV_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Hub", exact: true },
  { href: "/players", label: "Players" },
  { href: "/matchups", label: "Matchups" },
  { href: "/dues", label: "Dues" },
  { href: "/polls", label: "Polls" },
  { href: "/trash-talk", label: "Trash talk" },
  { href: "/history", label: "History" },
  { href: "/drafts", label: "Drafts" },
  { href: "/punishments", label: "Punishments" },
  { href: "/badges", label: "Badges" },
  { href: "/constitution", label: "Constitution" },
  { href: "/admin", label: "Admin", adminOnly: true },
];

interface SiteHeaderProps {
  league: LeagueSettings;
  isAuthenticated?: boolean;
  isAdmin?: boolean;
  ownerName?: string | null;
  ownerAvatarUrl?: string | null;
  /** Logo + Sign in only (logged-out landing) */
  minimal?: boolean;
}

function shortLeagueName(name: string): string {
  const t = name.trim();
  if (!t) return "League";
  if (/upper\s*deck/i.test(t)) return "UFD";
  if (t.length <= 6) return t.toUpperCase();
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    const initials = words.map((w) => w[0]).join("").toUpperCase();
    if (initials.length >= 2 && initials.length <= 5) return initials;
  }
  return t.slice(0, 4).toUpperCase();
}

function linkActive(pathname: string, link: NavLink): boolean {
  if (link.exact) return pathname === link.href;
  return pathname === link.href || pathname.startsWith(`${link.href}/`);
}

function currentLabel(pathname: string, links: NavLink[]): string {
  const hit =
    links.find((l) => l.exact && pathname === l.href) ||
    links.find((l) => !l.exact && linkActive(pathname, l));
  return hit?.label ?? "Menu";
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Single sticky site header for every page.
 * crest + UFD + Live | current-page menu ▾ | avatar (or Sign in)
 */
export function SiteHeader({
  league,
  isAuthenticated = false,
  isAdmin = false,
  ownerName = null,
  ownerAvatarUrl = null,
  minimal = false,
}: SiteHeaderProps) {
  const pathname = usePathname() || "/";
  const brand = shortLeagueName(league.name);
  const homeHref = isAuthenticated ? "/dashboard" : "/";

  const links = NAV_LINKS.filter((l) => !l.adminOnly || isAdmin);
  const menuLabel = currentLabel(pathname, links);

  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const avatarId = useId();

  // Close menus on route change
  useEffect(() => {
    setMenuOpen(false);
    setAvatarOpen(false);
  }, [pathname]);

  // Click outside
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(t)) setMenuOpen(false);
      if (avatarRef.current && !avatarRef.current.contains(t)) {
        setAvatarOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <>
      <div className="ff-top-stripe" />
      <header className="ff-nav sticky top-0 z-40">
        <div className="ff-page flex items-center gap-2 py-3 sm:gap-3 sm:py-2.5">
          {/* Brand */}
          <Link
            href={homeHref}
            className="flex min-w-0 shrink-0 items-center gap-2"
          >
            <div
              className={cn(
                "relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden",
                "rounded-lg border-2 border-foreground bg-black",
                "shadow-[2px_2px_0_0_#141414]"
              )}
              aria-hidden
            >
              <Image
                src="/icons/ud-v5-96.png"
                alt=""
                width={40}
                height={40}
                className="h-full w-full object-cover"
                priority
              />
            </div>
            <span className="ff-display text-base tracking-wide">{brand}</span>
          </Link>

          {!minimal && (
            <span className="ff-live-pill !hidden sm:!inline-flex">Live</span>
          )}

          <div className="ml-auto flex min-w-0 items-center gap-1.5 sm:gap-2">
            {/* Page menu — all routes in one place */}
            {!minimal && (
              <div className="relative min-w-0" ref={menuRef}>
                <button
                  type="button"
                  id={menuId}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  onClick={() => {
                    setMenuOpen((v) => !v);
                    setAvatarOpen(false);
                  }}
                  className={cn(
                    "inline-flex min-h-10 max-w-[11rem] items-center gap-1.5 rounded-lg border-2 border-foreground bg-white px-3",
                    "text-[11px] font-bold uppercase tracking-[0.12em] text-foreground",
                    "shadow-[2px_2px_0_0_#141414] hover:bg-[#f4f2ef] sm:max-w-none"
                  )}
                >
                  <span className="truncate">{menuLabel}</span>
                  <span aria-hidden className="text-[10px] opacity-70">
                    ▾
                  </span>
                </button>
                {menuOpen && (
                  <div
                    role="menu"
                    aria-labelledby={menuId}
                    className="absolute right-0 z-50 mt-2 max-h-[70vh] w-56 overflow-y-auto rounded-xl border-2 border-foreground bg-white py-1 shadow-[4px_4px_0_0_#141414]"
                  >
                    {links.map((link) => {
                      const active = linkActive(pathname, link);
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          role="menuitem"
                          onClick={() => setMenuOpen(false)}
                          className={cn(
                            "block px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em]",
                            active
                              ? "bg-foreground text-background"
                              : "text-muted-foreground hover:bg-[#f4f2ef] hover:text-foreground"
                          )}
                        >
                          {link.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Auth: avatar menu or Sign in */}
            {isAuthenticated ? (
              <div className="relative" ref={avatarRef}>
                <button
                  type="button"
                  id={avatarId}
                  aria-haspopup="menu"
                  aria-expanded={avatarOpen}
                  aria-label={ownerName ? `Account · ${ownerName}` : "Account"}
                  onClick={() => {
                    setAvatarOpen((v) => !v);
                    setMenuOpen(false);
                  }}
                  className="relative inline-flex h-10 w-10 items-center justify-center overflow-visible rounded-full border-2 border-foreground bg-[#f4f2ef] shadow-[2px_2px_0_0_#141414]"
                >
                  {ownerAvatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={ownerAvatarUrl}
                      alt=""
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] font-bold">
                      {initials(ownerName || "U")}
                    </span>
                  )}
                  {isAdmin && (
                    <span className="absolute -bottom-1 -right-1 rounded-full border border-foreground bg-[var(--accent-gold)] px-1 py-px text-[8px] font-bold uppercase leading-none text-foreground">
                      Admin
                    </span>
                  )}
                </button>
                {avatarOpen && (
                  <div
                    role="menu"
                    aria-labelledby={avatarId}
                    className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-xl border-2 border-foreground bg-white py-1 shadow-[4px_4px_0_0_#141414]"
                  >
                    {ownerName && (
                      <p className="border-b border-border px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {ownerName}
                        {isAdmin ? " · Admin" : ""}
                      </p>
                    )}
                    <Link
                      href="/dashboard"
                      role="menuitem"
                      onClick={() => setAvatarOpen(false)}
                      className="block px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground hover:bg-[#f4f2ef] hover:text-foreground"
                    >
                      Hub
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        role="menuitem"
                        onClick={() => setAvatarOpen(false)}
                        className="block px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground hover:bg-[#f4f2ef] hover:text-foreground"
                      >
                        Admin
                      </Link>
                    )}
                    <form action="/auth/signout" method="post">
                      <button
                        type="submit"
                        role="menuitem"
                        className="block w-full px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground hover:bg-[#f4f2ef] hover:text-foreground"
                      >
                        Sign out
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex min-h-10 items-center rounded-lg border-2 border-foreground bg-foreground px-3 text-[11px] font-bold uppercase tracking-wide text-background shadow-[2px_2px_0_0_#141414] hover:bg-neutral-800"
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
