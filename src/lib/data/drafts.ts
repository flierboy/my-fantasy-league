/**
 * Draft history loaders.
 */

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { mapOwner } from "@/lib/data/mappers";
import type {
  DraftPick,
  DraftSource,
  DraftYear,
  Owner,
} from "@/lib/types";

const SOURCES = new Set<DraftSource>([
  "espn",
  "yahoo",
  "sleeper",
  "manual",
]);

export function mapDraftYear(row: Record<string, unknown>): DraftYear {
  const src = String(row.source ?? "manual");
  return {
    id: String(row.id),
    season_year: Number(row.season_year),
    source: SOURCES.has(src as DraftSource)
      ? (src as DraftSource)
      : "manual",
    notes: (row.notes as string | null) ?? null,
    sort_order: Number(row.sort_order ?? 0),
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

export function mapDraftPick(
  row: Record<string, unknown>,
  ownersById: Map<string, Owner>
): DraftPick {
  const ownerId =
    row.owner_id == null || row.owner_id === ""
      ? null
      : String(row.owner_id);
  return {
    id: String(row.id),
    draft_year_id: String(row.draft_year_id),
    season_year: Number(row.season_year),
    round: Number(row.round),
    pick_in_round: Number(row.pick_in_round),
    overall_pick: Number(row.overall_pick),
    player_name: String(row.player_name ?? ""),
    position: (row.position as string | null) ?? null,
    nfl_team: (row.nfl_team as string | null) ?? null,
    fantasy_owner_name: String(row.fantasy_owner_name ?? ""),
    owner_id: ownerId,
    owner: ownerId ? ownersById.get(ownerId) ?? null : null,
  };
}

export async function getDraftYears(options?: {
  withPicks?: boolean;
  seasonYear?: number;
}): Promise<{
  years: DraftYear[];
  source: "supabase" | "empty" | "error";
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { years: [], source: "empty" };
  }

  try {
    const supabase = await createClient();
    let yq = supabase
      .from("draft_years")
      .select("*")
      .order("season_year", { ascending: false });

    if (options?.seasonYear != null) {
      yq = yq.eq("season_year", options.seasonYear);
    }

    const [yearsRes, ownersRes] = await Promise.all([
      yq,
      supabase.from("owners").select("*"),
    ]);

    if (yearsRes.error) {
      console.error("[draft_years]", yearsRes.error.message);
      return {
        years: [],
        source: "error",
        error: yearsRes.error.message,
      };
    }

    const ownersById = new Map(
      (ownersRes.data ?? []).map((r) => {
        const o = mapOwner(r as Record<string, unknown>);
        return [o.id, o] as const;
      })
    );

    const yearRows = yearsRes.data ?? [];
    if (yearRows.length === 0) {
      return { years: [], source: "empty" };
    }

    const years = yearRows.map((r) =>
      mapDraftYear(r as Record<string, unknown>)
    );

    if (options?.withPicks === false) {
      // pick counts only
      const { data: counts } = await supabase
        .from("draft_picks")
        .select("draft_year_id");
      const tally = new Map<string, number>();
      for (const c of counts ?? []) {
        const id = String((c as { draft_year_id: string }).draft_year_id);
        tally.set(id, (tally.get(id) ?? 0) + 1);
      }
      for (const y of years) {
        y.pick_count = tally.get(y.id) ?? 0;
      }
      return { years, source: "supabase" };
    }

    const yearIds = years.map((y) => y.id);
    const { data: pickRows, error: pErr } = await supabase
      .from("draft_picks")
      .select("*")
      .in("draft_year_id", yearIds)
      .order("overall_pick", { ascending: true });

    if (pErr) {
      console.error("[draft_picks]", pErr.message);
      return { years, source: "supabase", error: pErr.message };
    }

    const byYear = new Map<string, DraftPick[]>();
    for (const row of pickRows ?? []) {
      const p = mapDraftPick(row as Record<string, unknown>, ownersById);
      const list = byYear.get(p.draft_year_id) ?? [];
      list.push(p);
      byYear.set(p.draft_year_id, list);
    }

    for (const y of years) {
      y.picks = byYear.get(y.id) ?? [];
      y.pick_count = y.picks.length;
    }

    return { years, source: "supabase" };
  } catch (err) {
    console.error("[drafts] unexpected:", err);
    return {
      years: [],
      source: "error",
      error: err instanceof Error ? err.message : "Unexpected error",
    };
  }
}

export function groupPicksByRound(picks: DraftPick[]): Map<number, DraftPick[]> {
  const map = new Map<number, DraftPick[]>();
  for (const p of picks) {
    const list = map.get(p.round) ?? [];
    list.push(p);
    map.set(p.round, list);
  }
  for (const [r, list] of map) {
    map.set(
      r,
      [...list].sort((a, b) => a.pick_in_round - b.pick_in_round)
    );
  }
  return map;
}
