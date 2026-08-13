import type { LeagueSettings } from "@/lib/types";

interface SiteFooterProps {
  league: LeagueSettings;
}

export function SiteFooter({ league }: SiteFooterProps) {
  return (
    <footer className="ff-site-footer border-t-2 border-foreground bg-white py-5 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
      {league.name} · Private league · {league.season_year}
    </footer>
  );
}
