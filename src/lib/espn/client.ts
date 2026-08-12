/**
 * Unofficial ESPN Fantasy Football API client (one-time historical import).
 *
 * Public seasons: no cookies needed.
 * Private / historical seasons (e.g. 2025 for league 289190972): require
 * SWID + espn_s2 cookies from a logged-in ESPN browser session.
 */

export const ESPN_DEFAULT_LEAGUE_ID = "289190972";
export const ESPN_DEFAULT_SEASON = 2025;

export type EspnFetchOptions = {
  leagueId: string;
  season: number;
  /** Browser cookie SWID (with or without braces) */
  swid?: string;
  /** Browser cookie espn_s2 (long token, often URL-encoded) */
  espnS2?: string;
};

export type EspnMember = {
  id: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
};

export type EspnTeamRecord = {
  wins?: number;
  losses?: number;
  ties?: number;
  pointsFor?: number;
  pointsAgainst?: number;
};

export type EspnTeam = {
  id: number;
  abbrev?: string;
  name?: string;
  location?: string;
  nickname?: string;
  owners?: string[];
  primaryOwner?: string;
  playoffSeed?: number;
  rankCalculatedFinal?: number;
  rankFinal?: number;
  points?: number;
  pointsAgainst?: number;
  record?: {
    overall?: EspnTeamRecord;
  };
};

export type EspnScheduleGame = {
  id: number;
  matchupPeriodId: number;
  playoffTierType?: string;
  winner?: string;
  home?: { teamId: number; totalPoints?: number };
  away?: { teamId: number; totalPoints?: number };
};

export type EspnLeaguePayload = {
  id: number;
  seasonId: number;
  members?: EspnMember[];
  teams?: EspnTeam[];
  schedule?: EspnScheduleGame[];
  settings?: { name?: string };
  status?: {
    finalScoringPeriod?: number;
    currentMatchupPeriod?: number;
    previousSeasons?: number[];
    isActive?: boolean;
  };
};

/** Normalize SWID to ESPN's braced UUID form: {XXXXXXXX-XXXX-...} */
export function normalizeSwid(raw?: string): string | undefined {
  if (!raw) return undefined;
  let s = raw.trim();
  // Strip surrounding quotes
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  // Allow "SWID=..." paste
  if (s.toUpperCase().startsWith("SWID=")) {
    s = s.slice(5).trim();
  }
  // Strip braces then re-add
  const bare = s.replace(/^\{|\}$/g, "").trim();
  if (!bare) return undefined;
  // UUID-ish check (loose)
  if (!/^[0-9A-Fa-f-]{20,}$/.test(bare)) {
    // Still pass through — ESPN may accept non-standard
    return `{${bare}}`;
  }
  return `{${bare}}`;
}

/** Normalize espn_s2 (strip prefixes, keep encoded form as browser stores it). */
export function normalizeEspnS2(raw?: string): string | undefined {
  if (!raw) return undefined;
  let s = raw.trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  if (s.toLowerCase().startsWith("espn_s2=")) {
    s = s.slice(8).trim();
  }
  // Don't double-decode; browser cookie value is usually already what the API wants.
  // If user pasted a fully decoded value with spaces, re-encode is wrong — leave as-is.
  return s || undefined;
}

export function buildEspnCookieHeader(
  swid?: string,
  espnS2?: string
): string | undefined {
  const s = normalizeSwid(swid);
  const e = normalizeEspnS2(espnS2);
  const parts: string[] = [];
  if (s) parts.push(`SWID=${s}`);
  if (e) parts.push(`espn_s2=${e}`);
  return parts.length ? parts.join("; ") : undefined;
}

function leagueUrls(leagueId: string, season: number): string[] {
  const views = [
    "mTeam",
    "mStandings",
    "mMatchupScore",
    "mSettings",
    "mRoster",
  ];
  const qs = views.map((v) => `view=${encodeURIComponent(v)}`).join("&");
  // Prefer lm-api-reads (JSON API); fall back to fantasy.espn.com host
  return [
    `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${season}/segments/0/leagues/${leagueId}?${qs}`,
    `https://fantasy.espn.com/apis/v3/games/ffl/seasons/${season}/segments/0/leagues/${leagueId}?${qs}`,
  ];
}

/**
 * Fetch league JSON from ESPN.
 * Private / historical seasons: pass both swid and espnS2.
 */
export async function fetchEspnLeague(
  opts: EspnFetchOptions
): Promise<EspnLeaguePayload> {
  const { leagueId, season } = opts;
  const swid = normalizeSwid(opts.swid);
  const espnS2 = normalizeEspnS2(opts.espnS2);
  const cookie = buildEspnCookieHeader(swid, espnS2);
  const usedAuth = Boolean(cookie);

  if (season === 2025 && !usedAuth) {
    // Known: this league returns 401 for 2025 without cookies
    // Still attempt (in case ESPN changes), but warn in error if fails
  }

  const headers: Record<string, string> = {
    Accept: "application/json, text/plain, */*",
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Referer: `https://fantasy.espn.com/football/league?leagueId=${leagueId}&seasonId=${season}`,
    Origin: "https://fantasy.espn.com",
    "x-fantasy-platform": "kona-PROD-90cb445b403209159271303805769af80048171c",
    "x-fantasy-source": "kona",
  };
  if (cookie) {
    headers.Cookie = cookie;
  }

  let lastError = "ESPN request failed";
  for (const url of leagueUrls(leagueId, season)) {
    const res = await fetch(url, {
      headers,
      cache: "no-store",
      redirect: "follow",
    });

    const text = await res.text();
    let json: unknown = null;
    try {
      json = JSON.parse(text);
    } catch {
      // HTML login page or empty
      lastError = `ESPN returned non-JSON (HTTP ${res.status}). Cookies may be missing or expired.`;
      continue;
    }

    if (res.ok && json && typeof json === "object" && "teams" in (json as object)) {
      return json as EspnLeaguePayload;
    }

    const msg =
      (json as { messages?: string[] })?.messages?.[0] ||
      `ESPN API HTTP ${res.status}`;

    if (res.status === 401 || res.status === 403) {
      lastError = usedAuth
        ? `${msg} Cookies were sent but ESPN still denied access. Re-copy SWID + espn_s2 from a fresh login (they expire), and make sure the account is a member of league ${leagueId}.`
        : `${msg} Season ${season} is not publicly readable. Paste both SWID and espn_s2 cookies from a logged-in ESPN session (required for 2025 on this league).`;
      // Don't try next host for 401 without cookies; with cookies try both hosts
      if (!usedAuth) break;
      continue;
    }

    if (res.status === 404) {
      lastError = `League ${leagueId} not found for season ${season}.`;
      break;
    }

    lastError = msg;
  }

  throw new Error(lastError);
}

export function espnTeamDisplayName(team: EspnTeam): string {
  if (team.name?.trim()) return team.name.trim();
  const loc = team.location?.trim() ?? "";
  const nick = team.nickname?.trim() ?? "";
  const combined = `${loc} ${nick}`.trim();
  if (combined) return combined;
  return team.abbrev?.trim() || `Team ${team.id}`;
}

export function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}
