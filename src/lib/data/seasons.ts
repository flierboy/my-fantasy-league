/**
 * Past seasons + standings (manual admin entry).
 */

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { mapOwner } from "@/lib/data/mappers";
import type { Owner, PastSeason, PastSeasonStanding } from "@/lib/types";

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
      is_champion: row.is_champion || season.champion_owner_id === ownerId,
      is_runner_up: row.is_runner_up || season.runner_up_owner_id === ownerId,
      team_name: row.team_name,
    });
  }

  return out.sort((a, b) => b.season_year - a.season_year);
}
