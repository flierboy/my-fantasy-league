import { SLEEPER_DEFAULT_LEAGUE_ID } from "@/lib/sleeper/client";

/** Resolve league id from settings or the known Upper Deckcers default. */
export function resolveSleeperLeagueId(
  leagueId?: string | null
): string {
  const id = (leagueId ?? "").trim();
  return id || SLEEPER_DEFAULT_LEAGUE_ID;
}

export function sleeperLeagueWebUrl(leagueId?: string | null): string {
  return `https://sleeper.com/leagues/${resolveSleeperLeagueId(leagueId)}`;
}

export function sleeperLeagueAppUrl(leagueId?: string | null): string {
  return `sleeper://league/${resolveSleeperLeagueId(leagueId)}`;
}
