/**
 * Past seasons + standings (manual admin entry).
 * Career franchise stats are summed from past_season_standings (+ optional current).
 */

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { mapOwner } from "@/lib/data/mappers";
import { computeWinPct } from "@/lib/utils";
import type { Owner, PastSeason, PastSeasonStanding } from "@/lib/types";

/** Aggregated career franchise record for one owner. */
export type CareerFranchiseStats = {
  owner_id: string;
  wins: number;
  losses: number;
  ties: number;
  points_for: number;
  points_against: number;
  seasons_played: number;
  /** 0–1; 0 when no games */
  win_pct: number;
  /** True when W-L/PF/PA came only from owners.* fallback (no past rows). */
  from_owner_fallback: boolean;
};

export function mapPastSeasonStanding(
  row: Record<string, unknown>,
  ownersById: Map<string, Owner>
): PastSeasonStanding {
  const ownerId =
    row.owner_id == null || row.owner_id === ""
      ? null
      : String(row.owner_id);
  return {
    id: String(row.id),
    season_id: String(row.season_id),
    owner_id: ownerId,
    team_name: (row.team_name as string | null) ?? null,
    wins: Number(row.wins ?? 0),
    losses: Number(row.losses ?? 0),
    ties: Number(row.ties ?? 0),
    points_for: Number(row.points_for ?? 0),
    points_against: Number(row.points_against ?? 0),
    rank: Number(row.rank ?? 0),
    is_champion: Boolean(row.is_champion),
    is_runner_up: Boolean(row.is_runner_up),
    owner: ownerId ? ownersById.get(ownerId) ?? null : null,
  };
}

export function mapPastSeason(
  row: Record<string, unknown>,
  ownersById: Map<string, Owner>,
  standings: PastSeasonStanding[] = []
): PastSeason {
  const champId =
    row.champion_owner_id == null
      ? null
      : String(row.champion_owner_id);
  const ruId =
    row.runner_up_owner_id == null
      ? null
      : String(row.runner_up_owner_id);
  return {
    id: String(row.id),
    season_year: Number(row.season_year),
    label: String(row.label ?? row.season_year ?? ""),
    recap_notes: (row.recap_notes as string | null) ?? null,
    champion_owner_id: champId,
    runner_up_owner_id: ruId,
    sort_order: Number(row.sort_order ?? 0),
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
    standings,
    champion: champId ? ownersById.get(champId) ?? null : null,
    runner_up: ruId ? ownersById.get(ruId) ?? null : null,
  };
}

export async function getPastSeasons(options?: {
  withStandings?: boolean;
}): Promise<{
  seasons: PastSeason[];
  source: "supabase" | "empty" | "error";
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { seasons: [], source: "empty" };
  }

  try {
    const supabase = await createClient();
    const [seasonsRes, ownersRes] = await Promise.all([
      supabase
        .from("past_seasons")
        .select("*")
        .order("season_year", { ascending: false }),
      supabase.from("owners").select("*"),
    ]);

    if (seasonsRes.error) {
      console.error("[past_seasons]", seasonsRes.error.message);
      return {
        seasons: [],
        source: "error",
        error: seasonsRes.error.message,
      };
    }

    const ownersById = new Map(
      (ownersRes.data ?? []).map((r) => {
        const o = mapOwner(r as Record<string, unknown>);
        return [o.id, o] as const;
      })
    );

    const seasonRows = seasonsRes.data ?? [];
    if (seasonRows.length === 0) {
      return { seasons: [], source: "empty" };
    }

    let standingsBySeason = new Map<string, PastSeasonStanding[]>();

    if (options?.withStandings !== false) {
      const { data: standRows, error: stErr } = await supabase
        .from("past_season_standings")
        .select("*")
        .order("rank", { ascending: true });

      if (stErr) {
        console.error("[past_season_standings]", stErr.message);
      } else {
        standingsBySeason = new Map();
        for (const row of standRows ?? []) {
          const s = mapPastSeasonStanding(
            row as Record<string, unknown>,
            ownersById
          );
          const list = standingsBySeason.get(s.season_id) ?? [];
          list.push(s);
          standingsBySeason.set(s.season_id, list);
        }
      }
    }

    const seasons = seasonRows.map((row) => {
      const id = String((row as { id: string }).id);
      return mapPastSeason(
        row as Record<string, unknown>,
        ownersById,
        standingsBySeason.get(id) ?? []
      );
    });

    return { seasons, source: "supabase" };
  } catch (err) {
    console.error("[past_seasons] unexpected:", err);
    return {
      seasons: [],
      source: "error",
      error: err instanceof Error ? err.message : "Unexpected error",
    };
  }
}

/** Finishes for one owner across past seasons (for profiles). */
export function ownerSeasonFinishes(
  seasons: PastSeason[],
  ownerId: string
): {
  season_year: number;
  rank: number;
  wins: number;
  losses: number;
  ties: number;
  points_for: number;
  points_against: number;
  win_pct: number;
  is_champion: boolean;
  is_runner_up: boolean;
  team_name: string | null;
}[] {
  const out: {
    season_year: number;
    rank: number;
    wins: number;
    losses: number;
    ties: number;
    points_for: number;
    points_against: number;
    win_pct: number;
    is_champion: boolean;
    is_runner_up: boolean;
    team_name: string | null;
  }[] = [];

  for (const season of seasons) {
    const row = (season.standings ?? []).find((s) => s.owner_id === ownerId);
    if (!row) continue;
    out.push({
      season_year: season.season_year,
      rank: row.rank,
      wins: row.wins,
      losses: row.losses,
      ties: row.ties,
      points_for: row.points_for,
      points_against: row.points_against,
      win_pct: computeWinPct(row.wins, row.losses, row.ties),
      is_champion: row.is_champion || season.champion_owner_id === ownerId,
      is_runner_up: row.is_runner_up || season.runner_up_owner_id === ownerId,
      team_name: row.team_name,
    });
  }

  return out.sort((a, b) => b.season_year - a.season_year);
}

/**
 * Sum career W-L / PF / PA from past_season_standings.
 * Owners with no past rows fall back to owners.wins/losses/ties (PF/PA 0).
 * Optional `currentByOwner` adds live season-to-date when that year isn't already in past_seasons.
 */
export function buildCareerFranchiseStats(
  owners: Owner[],
  seasons: PastSeason[],
  options?: {
    /** Live season-to-date by owner_id (week=null standings or similar) */
    currentByOwner?: Map<
      string,
      {
        wins: number;
        losses: number;
        ties: number;
        points_for: number;
        points_against: number;
      }
    >;
    /** Season year of current data — skipped if already present as a past season */
    currentSeasonYear?: number;
  }
): Map<string, CareerFranchiseStats> {
  const map = new Map<string, CareerFranchiseStats>();

  for (const o of owners) {
    map.set(o.id, {
      owner_id: o.id,
      wins: 0,
      losses: 0,
      ties: 0,
      points_for: 0,
      points_against: 0,
      seasons_played: 0,
      win_pct: 0,
      from_owner_fallback: true,
    });
  }

  const pastYears = new Set(seasons.map((s) => s.season_year));

  for (const season of seasons) {
    for (const row of season.standings ?? []) {
      if (!row.owner_id) continue;
      let cur = map.get(row.owner_id);
      if (!cur) {
        cur = {
          owner_id: row.owner_id,
          wins: 0,
          losses: 0,
          ties: 0,
          points_for: 0,
          points_against: 0,
          seasons_played: 0,
          win_pct: 0,
          from_owner_fallback: false,
        };
        map.set(row.owner_id, cur);
      }
      cur.wins += row.wins;
      cur.losses += row.losses;
      cur.ties += row.ties;
      cur.points_for += row.points_for;
      cur.points_against += row.points_against;
      cur.seasons_played += 1;
      cur.from_owner_fallback = false;
    }
  }

  // Fold in current season if not already archived as a past season
  const cy = options?.currentSeasonYear;
  const current = options?.currentByOwner;
  if (
    current &&
    cy != null &&
    !pastYears.has(cy)
  ) {
    for (const [ownerId, row] of current) {
      let cur = map.get(ownerId);
      if (!cur) {
        cur = {
          owner_id: ownerId,
          wins: 0,
          losses: 0,
          ties: 0,
          points_for: 0,
          points_against: 0,
          seasons_played: 0,
          win_pct: 0,
          from_owner_fallback: false,
        };
        map.set(ownerId, cur);
      }
      cur.wins += row.wins;
      cur.losses += row.losses;
      cur.ties += row.ties;
      cur.points_for += row.points_for;
      cur.points_against += row.points_against;
      cur.seasons_played += 1;
      cur.from_owner_fallback = false;
    }
  }

  // Fallback: owners with zero past/current rows use manual owners W-L
  for (const o of owners) {
    const cur = map.get(o.id)!;
    const games = cur.wins + cur.losses + cur.ties;
    if (games === 0 && cur.seasons_played === 0) {
      cur.wins = o.wins;
      cur.losses = o.losses;
      cur.ties = o.ties;
      cur.points_for = 0;
      cur.points_against = 0;
      cur.from_owner_fallback = true;
    }
    cur.win_pct = computeWinPct(cur.wins, cur.losses, cur.ties);
  }

  return map;
}

/** Load season-to-date standings (week null) for optional career merge. */
export async function getCurrentSeasonStandingsByOwner(
  seasonYear: number
): Promise<
  Map<
    string,
    {
      wins: number;
      losses: number;
      ties: number;
      points_for: number;
      points_against: number;
    }
  >
> {
  const empty = new Map<
    string,
    {
      wins: number;
      losses: number;
      ties: number;
      points_for: number;
      points_against: number;
    }
  >();
  if (!isSupabaseConfigured()) return empty;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("standings")
      .select("owner_id, wins, losses, ties, points_for, points_against")
      .eq("season", seasonYear)
      .is("week", null);

    if (error || !data) return empty;

    const map = new Map<
      string,
      {
        wins: number;
        losses: number;
        ties: number;
        points_for: number;
        points_against: number;
      }
    >();
    for (const row of data) {
      const id = String(row.owner_id);
      map.set(id, {
        wins: Number(row.wins ?? 0),
        losses: Number(row.losses ?? 0),
        ties: Number(row.ties ?? 0),
        points_for: Number(row.points_for ?? 0),
        points_against: Number(row.points_against ?? 0),
      });
    }
    return map;
  } catch {
    return empty;
  }
}
