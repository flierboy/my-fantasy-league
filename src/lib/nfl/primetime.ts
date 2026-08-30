/**
 * Weekly NFL primetime slate (TNF / Sat / SNF / MNF) from ESPN scoreboard.
 * Week synced from Sleeper NFL state when available.
 */

import { fetchSleeperNflState } from "@/lib/sleeper/client";
import { getLeagueEvents } from "@/lib/data/events";
import type { LeagueEvent } from "@/lib/types";

const ESPN_SCOREBOARD =
  "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard";

/** Hours after kickoff before a game drops from Hub popup / upcoming. */
export const PRIMETIME_POPUP_GRACE_HOURS = 6;

export type PrimetimeNight =
  | "Thursday Night"
  | "Saturday"
  | "Sunday Night"
  | "Monday Night";

export type PrimetimeGame = {
  id: string;
  night: PrimetimeNight;
  away: string;
  home: string;
  /** ISO kickoff */
  starts_at: string;
  network: string | null;
  week: number;
};

export type PrimetimeSlate = {
  games: PrimetimeGame[];
  week: number | null;
  season: number | null;
  source: "espn" | "events" | "empty" | "error";
  error?: string;
};

type EspnEvent = {
  id?: string;
  date?: string;
  name?: string;
  competitions?: {
    competitors?: {
      homeAway?: string;
      team?: { abbreviation?: string; displayName?: string };
    }[];
    broadcasts?: { market?: string; names?: string[] }[];
    geoBroadcasts?: {
      media?: { shortName?: string; shortDisplayName?: string };
      type?: { shortName?: string };
    }[];
  }[];
};

function chicagoWeekdayAndHour(iso: string): {
  weekday: string;
  hour24: number;
} | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const weekday = d.toLocaleString("en-US", {
    timeZone: "America/Chicago",
    weekday: "long",
  });
  const hourStr = d.toLocaleString("en-US", {
    timeZone: "America/Chicago",
    hour: "numeric",
    hour12: false,
  });
  // en-US hour12:false can still yield "24" for midnight in some engines
  let hour24 = Number.parseInt(hourStr, 10);
  if (hour24 === 24) hour24 = 0;
  if (!Number.isFinite(hour24)) return null;
  return { weekday, hour24 };
}

/** Classify a kickoff as a primetime window (Chicago local). */
export function classifyPrimetimeNight(iso: string): PrimetimeNight | null {
  const parts = chicagoWeekdayAndHour(iso);
  if (!parts) return null;
  const { weekday, hour24 } = parts;
  // Evening windows — afternoon Sunday slate is not SNF
  if (weekday === "Thursday" && hour24 >= 17) return "Thursday Night";
  if (weekday === "Saturday" && hour24 >= 15) return "Saturday";
  if (weekday === "Sunday" && hour24 >= 18) return "Sunday Night";
  if (weekday === "Monday" && hour24 >= 17) return "Monday Night";
  return null;
}

const NETWORK_ALIASES: Record<string, string> = {
  nbc: "NBC",
  fox: "FOX",
  espn: "ESPN",
  abc: "ABC",
  cbs: "CBS",
  amazon: "Amazon",
  "prime video": "Amazon",
  "amazon prime": "Amazon",
  "amazon prime video": "Amazon",
  netflix: "Netflix",
  nfln: "NFL Network",
  "nfl network": "NFL Network",
  peacock: "Peacock",
};

function normalizeNetwork(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const key = raw.trim().toLowerCase();
  if (!key) return null;
  return NETWORK_ALIASES[key] ?? raw.trim();
}

function extractNetwork(
  comp: NonNullable<EspnEvent["competitions"]>[number] | undefined
): string | null {
  if (!comp) return null;
  const fromBroadcast = (comp.broadcasts ?? [])
    .flatMap((b) => b.names ?? [])
    .find(Boolean);
  if (fromBroadcast) return normalizeNetwork(fromBroadcast);
  const fromGeo = (comp.geoBroadcasts ?? [])
    .map((g) => g.media?.shortName || g.media?.shortDisplayName)
    .find(Boolean);
  return normalizeNetwork(fromGeo ?? null);
}

function nightSortOrder(n: PrimetimeNight): number {
  switch (n) {
    case "Thursday Night":
      return 1;
    case "Saturday":
      return 2;
    case "Sunday Night":
      return 3;
    case "Monday Night":
      return 4;
    default:
      return 9;
  }
}

function pickPrimetimeFromEvents(
  events: EspnEvent[],
  week: number
): PrimetimeGame[] {
  const byNight = new Map<PrimetimeNight, PrimetimeGame>();

  for (const ev of events) {
    const iso = ev.date;
    if (!iso) continue;
    const night = classifyPrimetimeNight(iso);
    if (!night) continue;
    const comp = ev.competitions?.[0];
    if (!comp) continue;
    const away = comp.competitors?.find((c) => c.homeAway === "away");
    const home = comp.competitors?.find((c) => c.homeAway === "home");
    const awayAbbr =
      away?.team?.abbreviation || away?.team?.displayName || "TBD";
    const homeAbbr =
      home?.team?.abbreviation || home?.team?.displayName || "TBD";
    const game: PrimetimeGame = {
      id: String(ev.id ?? `${awayAbbr}-${homeAbbr}-${iso}`),
      night,
      away: awayAbbr,
      home: homeAbbr,
      starts_at: new Date(iso).toISOString(),
      network: extractNetwork(comp),
      week,
    };
    const existing = byNight.get(night);
    // Prefer the latest kickoff for that night (true SNF vs earlier Sunday specials)
    if (
      !existing ||
      new Date(game.starts_at).getTime() > new Date(existing.starts_at).getTime()
    ) {
      byNight.set(night, game);
    }
  }

  return [...byNight.values()].sort((a, b) => {
    const o = nightSortOrder(a.night) - nightSortOrder(b.night);
    if (o !== 0) return o;
    return (
      new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
    );
  });
}

async function fetchEspnScoreboard(
  week: number,
  season: number,
  seasontype: number
): Promise<EspnEvent[]> {
  const url = new URL(ESPN_SCOREBOARD);
  url.searchParams.set("week", String(week));
  url.searchParams.set("seasontype", String(seasontype));
  url.searchParams.set("dates", String(season));

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    next: { revalidate: 1800 }, // 30 min cache
  });
  if (!res.ok) {
    throw new Error(`ESPN scoreboard ${res.status}`);
  }
  const data = (await res.json()) as { events?: EspnEvent[] };
  return data.events ?? [];
}

function seasontypeFromSleeper(seasonType: string | undefined): number {
  const t = (seasonType || "").toLowerCase();
  if (t.includes("pre")) return 1;
  if (t.includes("post")) return 3;
  return 2;
}

/** Parse Admin-created kind=nfl fallback rows into PrimetimeGame. */
function gamesFromNflEvents(
  events: LeagueEvent[],
  week: number | null
): PrimetimeGame[] {
  const out: PrimetimeGame[] = [];
  for (const ev of events) {
    if (ev.kind !== "nfl") continue;
    const night = classifyPrimetimeNight(ev.starts_at);
    if (!night) continue;
    // Title forms: "NE @ SEA" or "Thursday Night: NE @ SEA"
    const raw = ev.title.replace(/^[^:]+:\s*/, "").trim();
    const m = raw.match(/^(.+?)\s*@\s*(.+)$/);
    const away = (m?.[1] || "TBD").trim();
    const home = (m?.[2] || "TBD").trim();
    out.push({
      id: ev.id,
      night,
      away,
      home,
      starts_at: ev.starts_at,
      network: ev.location,
      week: week ?? 0,
    });
  }
  // Dedupe by night like ESPN path
  const byNight = new Map<PrimetimeNight, PrimetimeGame>();
  for (const g of out) {
    const existing = byNight.get(g.night);
    if (
      !existing ||
      new Date(g.starts_at).getTime() > new Date(existing.starts_at).getTime()
    ) {
      byNight.set(g.night, g);
    }
  }
  return [...byNight.values()].sort(
    (a, b) => nightSortOrder(a.night) - nightSortOrder(b.night)
  );
}

/**
 * Current week's TNF / Sat / SNF / MNF.
 * Prefer ESPN; fall back to league_events kind=nfl. Never invents games.
 */
export async function getPrimetimeSlate(): Promise<PrimetimeSlate> {
  let week: number | null = null;
  let season: number | null = null;
  let seasontype = 2;

  try {
    const state = await fetchSleeperNflState();
    week = Number(state.display_week || state.week) || null;
    season = Number(state.season || state.league_season) || null;
    seasontype = seasontypeFromSleeper(state.season_type);
  } catch (err) {
    console.error("[primetime] sleeper state:", err);
  }

  if (week != null && season != null) {
    try {
      const events = await fetchEspnScoreboard(week, season, seasontype);
      const games = pickPrimetimeFromEvents(events, week);
      if (games.length > 0) {
        return { games, week, season, source: "espn" };
      }
      // ESPN ok but no primetime yet this week
      return { games: [], week, season, source: "empty" };
    } catch (err) {
      console.error("[primetime] espn:", err);
      // fall through to DB fallback
      const fallback = await getLeagueEvents();
      const games = gamesFromNflEvents(fallback.events, week);
      if (games.length > 0) {
        return {
          games,
          week,
          season,
          source: "events",
          error: err instanceof Error ? err.message : "ESPN fetch failed",
        };
      }
      return {
        games: [],
        week,
        season,
        source: "error",
        error: err instanceof Error ? err.message : "ESPN fetch failed",
      };
    }
  }

  // No Sleeper week — try ESPN default scoreboard, then DB
  try {
    const res = await fetch(ESPN_SCOREBOARD, {
      headers: { Accept: "application/json" },
      next: { revalidate: 1800 },
    });
    if (res.ok) {
      const data = (await res.json()) as {
        events?: EspnEvent[];
        week?: { number?: number };
        season?: { year?: number };
      };
      week = data.week?.number ?? week;
      season = data.season?.year ?? season;
      const games = pickPrimetimeFromEvents(
        data.events ?? [],
        week ?? 0
      );
      if (games.length > 0) {
        return { games, week, season, source: "espn" };
      }
    }
  } catch (err) {
    console.error("[primetime] espn default:", err);
  }

  const fallback = await getLeagueEvents();
  const games = gamesFromNflEvents(fallback.events, week);
  if (games.length > 0) {
    return { games, week, season, source: "events" };
  }
  return { games: [], week, season, source: "empty" };
}

/** Still eligible for Hub popup / "upcoming" (kickoff + grace). */
export function isPrimetimeStillActive(
  startsAtIso: string,
  nowMs = Date.now()
): boolean {
  const t = new Date(startsAtIso).getTime();
  if (!Number.isFinite(t)) return false;
  return nowMs < t + PRIMETIME_POPUP_GRACE_HOURS * 60 * 60 * 1000;
}

/** Map primetime games → LeagueEvent shape for Hub list/popup. */
export function primetimeToLeagueEvents(
  games: PrimetimeGame[]
): LeagueEvent[] {
  return games.map((g) => ({
    id: `nfl-${g.id}`,
    title: `${g.night}: ${g.away} @ ${g.home}`,
    starts_at: g.starts_at,
    location: g.network,
    kind: "nfl",
    created_at: new Date().toISOString(),
  }));
}

export { formatKickoffChicago } from "@/lib/data/events-format";
