/**
 * Full weekly NFL scoreboard from ESPN (Sleeper week when available).
 * Never invents games.
 */

import { fetchSleeperNflState } from "@/lib/sleeper/client";
import { getLeagueEvents } from "@/lib/data/events";

const ESPN_SCOREBOARD =
  "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard";

export type NflGameDay =
  | "Wed"
  | "Thu"
  | "Fri"
  | "Sat"
  | "Sun"
  | "Mon"
  | "Tue";

export type NflGame = {
  id: string;
  day: NflGameDay;
  away: string;
  home: string;
  /** ISO kickoff */
  starts_at: string;
  network: string | null;
  /** Scheduled · Q2 14-10 · Final 28-21 */
  status_label: string;
  state: "pre" | "in" | "post";
  away_score: number | null;
  home_score: number | null;
  week: number;
};

export type NflWeekScoreboard = {
  games: NflGame[];
  /** Games grouped by Chicago weekday, chronologically */
  byDay: { day: NflGameDay; label: string; games: NflGame[] }[];
  week: number | null;
  season: number | null;
  source: "espn" | "events" | "empty" | "error";
  error?: string;
};

type EspnEvent = {
  id?: string;
  date?: string;
  name?: string;
  status?: {
    period?: number;
    displayClock?: string;
    type?: {
      name?: string;
      state?: string;
      completed?: boolean;
      description?: string;
      detail?: string;
      shortDetail?: string;
    };
  };
  competitions?: {
    competitors?: {
      homeAway?: string;
      score?: string | number;
      team?: { abbreviation?: string; displayName?: string };
    }[];
    broadcasts?: { market?: string; names?: string[] }[];
    geoBroadcasts?: {
      media?: { shortName?: string; shortDisplayName?: string };
      type?: { shortName?: string };
    }[];
  }[];
};

const DAY_ORDER: NflGameDay[] = [
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
  "Mon",
  "Tue",
];

const DAY_LABEL: Record<NflGameDay, string> = {
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
  Mon: "Monday",
  Tue: "Tuesday",
};

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

function chicagoDay(iso: string): NflGameDay {
  const d = new Date(iso);
  const weekday = d.toLocaleString("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
  });
  const map: Record<string, NflGameDay> = {
    Wed: "Wed",
    Thu: "Thu",
    Fri: "Fri",
    Sat: "Sat",
    Sun: "Sun",
    Mon: "Mon",
    Tue: "Tue",
  };
  return map[weekday] ?? "Sun";
}

function periodLabel(period: number | undefined): string {
  if (period == null || period <= 0) return "Live";
  if (period <= 4) return `Q${period}`;
  if (period === 5) return "OT";
  return `OT${period - 4}`;
}

function parseScore(raw: string | number | undefined): number | null {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function formatNflStatusLabel(opts: {
  state: string | undefined;
  completed?: boolean;
  period?: number;
  awayScore: number | null;
  homeScore: number | null;
}): string {
  const state = (opts.state || "pre").toLowerCase();
  const away = opts.awayScore;
  const home = opts.homeScore;
  const scoreBit =
    away != null && home != null ? `${away}-${home}` : null;

  if (state === "post" || opts.completed) {
    return scoreBit ? `Final ${scoreBit}` : "Final";
  }
  if (state === "in") {
    const q = periodLabel(opts.period);
    return scoreBit ? `${q} ${scoreBit}` : q;
  }
  return "Scheduled";
}

function mapEspnEvent(ev: EspnEvent, week: number): NflGame | null {
  const iso = ev.date;
  if (!iso) return null;
  const comp = ev.competitions?.[0];
  if (!comp) return null;
  const away = comp.competitors?.find((c) => c.homeAway === "away");
  const home = comp.competitors?.find((c) => c.homeAway === "home");
  const awayAbbr =
    away?.team?.abbreviation || away?.team?.displayName || "TBD";
  const homeAbbr =
    home?.team?.abbreviation || home?.team?.displayName || "TBD";
  const awayScore = parseScore(away?.score);
  const homeScore = parseScore(home?.score);
  const rawState = (ev.status?.type?.state || "pre").toLowerCase();
  const state: NflGame["state"] =
    rawState === "in" || rawState === "post" ? rawState : "pre";

  return {
    id: String(ev.id ?? `${awayAbbr}-${homeAbbr}-${iso}`),
    day: chicagoDay(iso),
    away: awayAbbr,
    home: homeAbbr,
    starts_at: new Date(iso).toISOString(),
    network: extractNetwork(comp),
    status_label: formatNflStatusLabel({
      state: ev.status?.type?.state,
      completed: ev.status?.type?.completed,
      period: ev.status?.period,
      awayScore,
      homeScore,
    }),
    state,
    away_score: awayScore,
    home_score: homeScore,
    week,
  };
}

function groupByDay(games: NflGame[]): NflWeekScoreboard["byDay"] {
  const map = new Map<NflGameDay, NflGame[]>();
  for (const g of games) {
    const list = map.get(g.day) ?? [];
    list.push(g);
    map.set(g.day, list);
  }
  return DAY_ORDER.filter((d) => map.has(d)).map((day) => ({
    day,
    label: DAY_LABEL[day],
    games: [...(map.get(day) ?? [])].sort(
      (a, b) =>
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
    ),
  }));
}

async function fetchEspnScoreboardEvents(
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
    next: { revalidate: 1800 },
  });
  if (!res.ok) throw new Error(`ESPN scoreboard ${res.status}`);
  const data = (await res.json()) as { events?: EspnEvent[] };
  return data.events ?? [];
}

function seasontypeFromSleeper(seasonType: string | undefined): number {
  const t = (seasonType || "").toLowerCase();
  if (t.includes("pre")) return 1;
  if (t.includes("post")) return 3;
  return 2;
}

/** Admin kind=nfl rows as scheduled games (no live scores). */
function gamesFromNflEvents(
  events: { id: string; title: string; starts_at: string; location: string | null; kind: string }[],
  week: number | null
): NflGame[] {
  const out: NflGame[] = [];
  for (const ev of events) {
    if (ev.kind !== "nfl") continue;
    const raw = ev.title.replace(/^[^:]+:\s*/, "").trim();
    const m = raw.match(/^(.+?)\s*@\s*(.+)$/);
    if (!m) continue;
    const away = m[1].trim();
    const home = m[2].trim();
    out.push({
      id: ev.id,
      day: chicagoDay(ev.starts_at),
      away,
      home,
      starts_at: ev.starts_at,
      network: ev.location,
      status_label: "Scheduled",
      state: "pre",
      away_score: null,
      home_score: null,
      week: week ?? 0,
    });
  }
  return out.sort(
    (a, b) =>
      new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
  );
}

function pack(
  games: NflGame[],
  week: number | null,
  season: number | null,
  source: NflWeekScoreboard["source"],
  error?: string
): NflWeekScoreboard {
  return {
    games,
    byDay: groupByDay(games),
    week,
    season,
    source,
    error,
  };
}

/**
 * Full current NFL week scoreboard.
 * Prefer ESPN; fall back to league_events kind=nfl. Never invents games.
 */
export async function getNflWeekScoreboard(): Promise<NflWeekScoreboard> {
  let week: number | null = null;
  let season: number | null = null;
  let seasontype = 2;

  try {
    const state = await fetchSleeperNflState();
    week = Number(state.display_week || state.week) || null;
    season = Number(state.season || state.league_season) || null;
    seasontype = seasontypeFromSleeper(state.season_type);
  } catch (err) {
    console.error("[nfl-scoreboard] sleeper state:", err);
  }

  if (week != null && season != null) {
    const weekNum = week;
    const seasonNum = season;
    try {
      const events = await fetchEspnScoreboardEvents(
        weekNum,
        seasonNum,
        seasontype
      );
      const games = events
        .map((e) => mapEspnEvent(e, weekNum))
        .filter((g): g is NflGame => g != null)
        .sort(
          (a, b) =>
            new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
        );
      if (games.length > 0) return pack(games, weekNum, seasonNum, "espn");
      return pack([], weekNum, seasonNum, "empty");
    } catch (err) {
      console.error("[nfl-scoreboard] espn:", err);
      const fallback = await getLeagueEvents();
      const games = gamesFromNflEvents(fallback.events, weekNum);
      if (games.length > 0) {
        return pack(
          games,
          weekNum,
          seasonNum,
          "events",
          err instanceof Error ? err.message : "ESPN fetch failed"
        );
      }
      return pack(
        [],
        weekNum,
        seasonNum,
        "error",
        err instanceof Error ? err.message : "ESPN fetch failed"
      );
    }
  }

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
      const games = (data.events ?? [])
        .map((e) => mapEspnEvent(e, week ?? 0))
        .filter((g): g is NflGame => g != null)
        .sort(
          (a, b) =>
            new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
        );
      if (games.length > 0) return pack(games, week, season, "espn");
    }
  } catch (err) {
    console.error("[nfl-scoreboard] espn default:", err);
  }

  const fallback = await getLeagueEvents();
  const games = gamesFromNflEvents(fallback.events, week);
  if (games.length > 0) return pack(games, week, season, "events");
  return pack([], week, season, "empty");
}
