/**
 * Public Sleeper Fantasy API (no auth for basic league data).
 * Docs: https://docs.sleeper.com/
 */

export const SLEEPER_DEFAULT_LEAGUE_ID = "1393362654227099648";

const BASE = "https://api.sleeper.app/v1";

export type SleeperLeague = {
  league_id: string;
  name: string;
  season: string;
  status: string;
  total_rosters: number;
  sport?: string;
  season_type?: string;
  draft_id?: string;
  avatar?: string | null;
  settings?: Record<string, number | string | null>;
  scoring_settings?: Record<string, number>;
  roster_positions?: string[];
  metadata?: Record<string, string | null>;
};

export type SleeperUser = {
  user_id: string;
  display_name: string;
  avatar?: string | null;
  is_owner?: boolean;
  metadata?: {
    team_name?: string;
    [key: string]: string | undefined;
  } | null;
};

export type SleeperRoster = {
  roster_id: number;
  owner_id: string | null;
  co_owners?: string[] | null;
  settings?: {
    wins?: number;
    losses?: number;
    ties?: number;
    fpts?: number;
    fpts_decimal?: number;
    fpts_against?: number;
    fpts_against_decimal?: number;
    waiver_position?: number;
    [key: string]: number | undefined;
  };
};

export type SleeperNflState = {
  week: number;
  season: string;
  season_type: string;
  league_season: string;
  previous_season: string;
  display_week: number;
};

async function sleeperGet<T>(path: string): Promise<T> {
  const url = `${BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Sleeper API ${res.status} for ${path}${text ? `: ${text.slice(0, 200)}` : ""}`
    );
  }
  return res.json() as Promise<T>;
}

export async function fetchSleeperLeague(
  leagueId: string
): Promise<SleeperLeague> {
  return sleeperGet<SleeperLeague>(`/league/${leagueId}`);
}

export async function fetchSleeperUsers(
  leagueId: string
): Promise<SleeperUser[]> {
  return sleeperGet<SleeperUser[]>(`/league/${leagueId}/users`);
}

export async function fetchSleeperRosters(
  leagueId: string
): Promise<SleeperRoster[]> {
  return sleeperGet<SleeperRoster[]>(`/league/${leagueId}/rosters`);
}

export async function fetchSleeperNflState(): Promise<SleeperNflState> {
  return sleeperGet<SleeperNflState>("/state/nfl");
}

export function sleeperPoints(settings?: SleeperRoster["settings"]): number {
  if (!settings) return 0;
  const whole = Number(settings.fpts ?? 0);
  const dec = Number(settings.fpts_decimal ?? 0);
  // Sleeper often stores decimal part as integer (e.g. 45 → 0.45)
  if (dec >= 1) return whole + dec / 100;
  return whole + dec;
}

export function sleeperPointsAgainst(
  settings?: SleeperRoster["settings"]
): number {
  if (!settings) return 0;
  const whole = Number(settings.fpts_against ?? 0);
  const dec = Number(settings.fpts_against_decimal ?? 0);
  if (dec >= 1) return whole + dec / 100;
  return whole + dec;
}

export function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}
