"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const BASE_LINKS = [
  { href: "/dashboard", label: "Hub" },
  { href: "/players", label: "Players" },
  { href: "/matchups", label: "Matchups" },
  { href: "/dues", label: "Dues" },
  { href: "/polls", label: "Polls" },
  { href: "/trash-talk", label: "Trash talk" },
  { href: "/history", label: "History" },
  { href: "/badges", label: "Badges" },
  { href: "/constitution", label: "Constitution" },
];

export function DashboardNav({ showAdmin = true }: { showAdmin?: boolean }) {
  const pathname = usePathname();
  const links = showAdmin
    ? [...BASE_LINKS, { href: "/admin", label: "Admin" }]
    : BASE_LINKS;

  return (
    <nav className="ff-subnav">
      <div className="ff-page flex gap-0.5 overflow-x-auto py-2">
        {links.map((link) => {
          const active =
            pathname === link.href ||
            (link.href !== "/dashboard" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              data-active={active}
              className="ff-subnav-link"
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
