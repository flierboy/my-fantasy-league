/**
 * Past seasons + standings (manual admin entry).
 * Career franchise stats: reduce over past_season_standings by stable ownerId.
 */

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { mapOwner } from "@/lib/data/mappers";
import { computeWinPct } from "@/lib/utils";
import type { Owner, PastSeason, PastSeasonStanding } from "@/lib/types";

/** Career totals from past_season_standings only (stable ownerId). */
export type OwnerCareer = {
  w: number;
  l: number;
  t: number;
  /** null until at least one season has a real PF value */
  pf: number | null;
  /** null until at least one season has a real PA value */
  pa: number | null;
  /** 0–1, or null if no games */
  winPct: number | null;
  seasonsCounted: number;
  pfSeasons: number;
  paSeasons: number;
};

export type OwnerWithCareer = Owner & { career: OwnerCareer };

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

type CareerAcc = {
  wins: number;
  losses: number;
  ties: number;
  pf: number | null;
  pa: number | null;
  seasonsCounted: number;
  pfSeasons: number;
  paSeasons: number;
};

function emptyAcc(): CareerAcc {
  return {
    wins: 0,
    losses: 0,
    ties: 0,
    pf: null,
    pa: null,
    seasonsCounted: 0,
    pfSeasons: 0,
    paSeasons: 0,
  };
}

function isPresentNumber(v: unknown): v is number {
  return v != null && v !== "" && !Number.isNaN(Number(v));
}

/** Normalize a season bag that may use `.standings` or `.rows`. */
function seasonRows(
  season: PastSeason | { rows?: Record<string, unknown>[]; standings?: PastSeasonStanding[] }
): Record<string, unknown>[] {
  const any = season as {
    rows?: Record<string, unknown>[];
    standings?: PastSeasonStanding[];
  };
  if (Array.isArray(any.rows) && any.rows.length) {
    return any.rows;
  }
  return (any.standings ?? []).map((r) => ({
    ownerId: r.owner_id,
    owner_id: r.owner_id,
    id: r.owner_id,
    wins: r.wins,
    losses: r.losses,
    ties: r.ties,
    pf: r.points_for,
    pa: r.points_against,
    points_for: r.points_for,
    points_against: r.points_against,
  }));
}

/**
 * Career PF/PA/W-L from a reduce over past_season_standings.
 * Returns owners with `.career` attached (stable ownerId only).
 * Skips unmatched rows; skips missing pf/pa (does not treat as 0).
 */
export function buildCareerFranchiseStats(
  owners: Owner[],
  pastSeasonStandings: PastSeason[] | { rows?: Record<string, unknown>[] }[],
  _options?: unknown
): OwnerWithCareer[] {
  const byId = new Map<string, CareerAcc>(
    owners.map((o) => [o.id, emptyAcc()])
  );

  for (const season of pastSeasonStandings || []) {
    for (const row of seasonRows(season as PastSeason)) {
      const ownerId = String(
        row.ownerId ?? row.owner_id ?? row.id ?? ""
      );
      if (!ownerId) continue;
      const acc = byId.get(ownerId);
      if (!acc) continue;

      acc.seasonsCounted += 1;
      if (row.wins != null) acc.wins += Number(row.wins) || 0;
      if (row.losses != null) acc.losses += Number(row.losses) || 0;
      if (row.ties != null) acc.ties += Number(row.ties) || 0;

      const pfRaw = row.pf ?? row.points_for;
      if (isPresentNumber(pfRaw)) {
        acc.pf = (acc.pf ?? 0) + Number(pfRaw);
        acc.pfSeasons += 1;
      }

      const paRaw = row.pa ?? row.points_against;
      if (isPresentNumber(paRaw)) {
        acc.pa = (acc.pa ?? 0) + Number(paRaw);
        acc.paSeasons += 1;
      }
    }
  }

  return owners.map((o) => {
    const acc = byId.get(o.id) ?? emptyAcc();
    const games = acc.wins + acc.losses + acc.ties;
    return {
      ...o,
      career: {
        w: acc.wins,
        l: acc.losses,
        t: acc.ties,
        pf: acc.pf == null ? null : Math.round(acc.pf * 10) / 10,
        pa: acc.pa == null ? null : Math.round(acc.pa * 10) / 10,
        winPct: games ? (acc.wins + acc.ties * 0.5) / games : null,
        seasonsCounted: acc.seasonsCounted,
        pfSeasons: acc.pfSeasons,
        paSeasons: acc.paSeasons,
      },
    };
  });
}

/** Alias — same as buildCareerFranchiseStats. */
export function ownersWithCareer(
  owners: Owner[],
  pastSeasons: PastSeason[]
): OwnerWithCareer[] {
  return buildCareerFranchiseStats(owners, pastSeasons);
}

/** Map keyed by owner id (for call sites that still expect a Map). */
export function careerStatsByOwnerId(
  owners: Owner[],
  pastSeasons: PastSeason[]
): Map<string, OwnerCareer> {
  const list = buildCareerFranchiseStats(owners, pastSeasons);
  return new Map(list.map((o) => [o.id, o.career]));
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
