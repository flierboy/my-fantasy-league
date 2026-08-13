"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/owners", label: "Owners" },
  { href: "/admin/owners/bulk", label: "Bulk owners" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/history", label: "History" },
  { href: "/admin/import-espn", label: "ESPN import" },
  { href: "/admin/sleeper", label: "Sleeper" },
  { href: "/admin/matchups", label: "Matchups" },
  { href: "/admin/dues", label: "Dues" },
  { href: "/admin/polls", label: "Polls" },
  { href: "/admin/trash-talk", label: "Moderation" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-6 flex flex-wrap gap-1.5 rounded-xl border-2 border-foreground bg-white p-2 shadow-sm">
      {LINKS.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors",
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
