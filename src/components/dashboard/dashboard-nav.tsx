"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const BASE_LINKS = [
  { href: "/dashboard", label: "Hub" },
  { href: "/matchups", label: "Matchups" },
  { href: "/dues", label: "Dues" },
  { href: "/polls", label: "Polls" },
  { href: "/trash-talk", label: "Trash talk" },
];

export function DashboardNav({ showAdmin = true }: { showAdmin?: boolean }) {
  const pathname = usePathname();
  const links = showAdmin
    ? [...BASE_LINKS, { href: "/admin", label: "Admin" }]
    : BASE_LINKS;

  return (
    <nav className="border-b-2 border-foreground/10 bg-white">
      <div className="mx-auto flex w-full max-w-5xl gap-1 overflow-x-auto px-4 py-2 sm:px-6">
        {links.map((link) => {
          const active =
            pathname === link.href ||
            (link.href !== "/dashboard" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors",
                active
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
