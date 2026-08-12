import type { LeagueSettings } from "@/lib/types";

interface SiteFooterProps {
  league: LeagueSettings;
}

export function SiteFooter({ league }: SiteFooterProps) {
  return (
    <footer className="border-t-2 border-foreground/15 bg-white/40 py-5 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
      {league.name} · Private league · {league.season_year}
    </footer>
  );
}
