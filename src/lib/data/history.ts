/**
 * League history — live from Supabase history_entries.
 * DB column for type is `record_type` (app domain still uses entry_type).
 */

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { HistoryEntry, HistoryEntryType } from "@/lib/types";

export const ALL_TIME_BLURB =
  "All-time records, trophy walls, and hall-of-shame entries fill in as admins add history. Franchise W-L below tracks live owner records.";

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
  return {
    champions: entries.filter((e) => e.entry_type === "champion"),
    milestones: entries.filter((e) => e.entry_type === "milestone"),
    records: entries.filter((e) => e.entry_type === "record"),
    notes: entries.filter((e) => e.entry_type === "note"),
  };
}
