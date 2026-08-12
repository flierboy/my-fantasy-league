/**
 * League history — live from Supabase history_entries,
 * with static fallback only when the table is empty / unavailable.
 */

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { HistoryEntry, HistoryEntryType } from "@/lib/types";

export const ALL_TIME_BLURB =
  "All-time records, trophy walls, and hall-of-shame entries fill in as admins add history. Franchise W-L below tracks live owner records.";

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

export function mapHistoryEntry(row: Record<string, unknown>): HistoryEntry {
  return {
    id: String(row.id),
    entry_type: row.entry_type as HistoryEntryType,
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
      console.error("[history]", error.message);
      return { entries: FALLBACK_HISTORY, source: "placeholder" };
    }

    if (!data || data.length === 0) {
      return { entries: FALLBACK_HISTORY, source: "placeholder" };
    }

    return {
      entries: data.map((row) => mapHistoryEntry(row as Record<string, unknown>)),
      source: "supabase",
    };
  } catch (err) {
    console.error("[history] unexpected:", err);
    return { entries: FALLBACK_HISTORY, source: "placeholder" };
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
