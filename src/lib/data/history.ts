/**
 * League history — live from Supabase history_entries.
 * DB column for type is `record_type` (app domain still uses entry_type).
 */

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type {
  HistoryEntry,
  HistoryEntryType,
  PastSeason,
} from "@/lib/types";

export const ALL_TIME_BLURB =
  "Trophy wall and all-time franchise records. Champions come from Admin → Past seasons (and History entries). No invented years.";

/** One plaque on the public Trophy wall. */
export type TrophyPlaque = {
  id: string;
  season_year: number;
  year_label: string;
  champion_name: string;
  team_name: string | null;
  runner_up: string | null;
  notes: string | null;
  owner_id: string | null;
  avatar_url: string | null;
  source: "season" | "history";
};

/**
 * Merge past-season champions + history_entries (type=champion).
 * Newest year first. Never invents names — only recorded data.
 * Prefer past_seasons when both exist for the same year.
 */
export function buildTrophyWall(
  seasons: PastSeason[],
  historyChampions: HistoryEntry[]
): TrophyPlaque[] {
  const byYear = new Map<number, TrophyPlaque>();

  for (const season of seasons) {
    const champStanding =
      season.standings?.find(
        (s) =>
          s.is_champion ||
          (season.champion_owner_id != null &&
            s.owner_id === season.champion_owner_id)
      ) ?? null;

    const owner = season.champion ?? champStanding?.owner ?? null;
    const ownerId =
      season.champion_owner_id ?? champStanding?.owner_id ?? null;

    const championName =
      owner?.display_name?.trim() ||
      champStanding?.team_name?.trim() ||
      "";

    if (!championName) continue;

    const teamName =
      (champStanding?.team_name &&
      champStanding.team_name.trim() !== championName
        ? champStanding.team_name.trim()
        : null) ||
      (owner?.team_name && owner.team_name.trim() !== championName
        ? owner.team_name.trim()
        : null);

    byYear.set(season.season_year, {
      id: `season-${season.id}`,
      season_year: season.season_year,
      year_label: season.label || String(season.season_year),
      champion_name: championName,
      team_name: teamName,
      runner_up: season.runner_up?.display_name ?? null,
      notes: season.recap_notes,
      owner_id: ownerId,
      avatar_url: owner?.avatar_url ?? null,
      source: "season",
    });
  }

  for (const entry of historyChampions) {
    const year =
      entry.season_year ??
      (Number.parseInt(entry.year_label, 10) || null);
    if (year == null || !Number.isFinite(year)) continue;
    if (byYear.has(year)) continue;

    const championName =
      entry.champion?.trim() || entry.title?.trim() || "";
    if (!championName) continue;

    byYear.set(year, {
      id: `history-${entry.id}`,
      season_year: year,
      year_label: entry.year_label || String(year),
      champion_name: championName,
      team_name: null,
      runner_up: entry.runner_up,
      notes: entry.notes,
      owner_id: null,
      avatar_url: null,
      source: "history",
    });
  }

  return [...byYear.values()].sort((a, b) => b.season_year - a.season_year);
}

const VALID_TYPES = new Set<HistoryEntryType>([
  "champion",
  "milestone",
  "record",
  "note",
]);

/** Static placeholders only when DB has no entries yet. */
export const FALLBACK_HISTORY: HistoryEntry[] = [
  {
    id: "fallback-note",
    entry_type: "note",
    year_label: "2026",
    season_year: 2026,
    title: "Inaugural season",
    champion: null,
    runner_up: null,
    notes:
      "Upper Deckcers season 1 — use Admin → History to add champions, milestones, and records.",
    sort_order: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

/** Payload keys for insert/update — matches live Supabase columns. */
export function historyRowPayload(fields: {
  entry_type: HistoryEntryType;
  year_label: string;
  season_year: number | null;
  title: string;
  champion: string | null;
  runner_up: string | null;
  notes: string | null;
  sort_order: number;
}) {
  return {
    // Live DB column name (not entry_type)
    record_type: fields.entry_type,
    year_label: fields.year_label,
    season_year: fields.season_year,
    title: fields.title,
    champion: fields.champion,
    runner_up: fields.runner_up,
    notes: fields.notes,
    sort_order: fields.sort_order,
  };
}

export function mapHistoryEntry(row: Record<string, unknown>): HistoryEntry {
  // Support both column names during any transitional schemas
  const rawType = String(row.record_type ?? row.entry_type ?? "note");
  const entry_type = (
    VALID_TYPES.has(rawType as HistoryEntryType) ? rawType : "note"
  ) as HistoryEntryType;

  return {
    id: String(row.id),
    entry_type,
    year_label: String(row.year_label ?? ""),
    season_year: row.season_year == null ? null : Number(row.season_year),
    title: String(row.title ?? ""),
    champion: (row.champion as string | null) ?? null,
    runner_up: (row.runner_up as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    sort_order: Number(row.sort_order ?? 0),
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

export async function getHistoryEntries(): Promise<{
  entries: HistoryEntry[];
  source: "supabase" | "placeholder";
  /** True when the table exists but has zero rows (show empty admin list) */
  empty?: boolean;
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { entries: FALLBACK_HISTORY, source: "placeholder" };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("history_entries")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("season_year", { ascending: false, nullsFirst: false });

    if (error) {
      console.error("[history]", error.message, error.code);
      // Only treat as missing table when Postgres says relation does not exist
      const missing =
        error.code === "42P01" ||
        /relation ["']?public\.history_entries["']? does not exist/i.test(
          error.message
        ) ||
        /could not find the table/i.test(error.message);
      return {
        entries: FALLBACK_HISTORY,
        source: "placeholder",
        error: missing
          ? "history_entries table missing — run supabase/migrate-history-entries.sql"
          : error.message,
      };
    }

    if (!data || data.length === 0) {
      return {
        entries: [],
        source: "supabase",
        empty: true,
      };
    }

    return {
      entries: data.map((row) =>
        mapHistoryEntry(row as Record<string, unknown>)
      ),
      source: "supabase",
    };
  } catch (err) {
    console.error("[history] unexpected:", err);
    return {
      entries: FALLBACK_HISTORY,
      source: "placeholder",
      error: err instanceof Error ? err.message : "Unexpected history error",
    };
  }
}

export function groupHistory(entries: HistoryEntry[]) {
  const champions = entries
    .filter((e) => e.entry_type === "champion")
    .sort((a, b) => {
      const ay = a.season_year ?? (Number.parseInt(a.year_label, 10) || 0);
      const by = b.season_year ?? (Number.parseInt(b.year_label, 10) || 0);
      if (by !== ay) return by - ay;
      return a.sort_order - b.sort_order;
    });
  return {
    champions,
    milestones: entries.filter((e) => e.entry_type === "milestone"),
    records: entries.filter((e) => e.entry_type === "record"),
    notes: entries.filter((e) => e.entry_type === "note"),
  };
}
