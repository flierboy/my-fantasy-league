/**
 * League events for Hub list + daily popup.
 */

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { LeagueEvent } from "@/lib/types";

export { formatEventWhenEt } from "@/lib/data/events-format";

export function mapLeagueEvent(row: Record<string, unknown>): LeagueEvent {
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    starts_at: String(row.starts_at ?? ""),
    location: row.location == null ? null : String(row.location),
    kind: String(row.kind ?? "event"),
    created_at: String(row.created_at ?? ""),
  };
}

export async function getLeagueEvents(options?: {
  /** Only events with starts_at >= now - upcomingOnlyMs? (default: all future + recent) */
  upcomingOnly?: boolean;
  /** Include events starting within this many days ahead (for popup). */
  withinDays?: number;
}): Promise<{
  events: LeagueEvent[];
  source: "supabase" | "empty" | "error";
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { events: [], source: "empty" };
  }

  try {
    const supabase = await createClient();
    let query = supabase
      .from("league_events")
      .select("*")
      .order("starts_at", { ascending: true });

    if (options?.upcomingOnly) {
      query = query.gte("starts_at", new Date().toISOString());
    }

    if (options?.withinDays != null) {
      const now = new Date();
      const until = new Date(
        now.getTime() + options.withinDays * 24 * 60 * 60 * 1000
      );
      query = query
        .gte("starts_at", now.toISOString())
        .lte("starts_at", until.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error("[league_events]", error.message);
      return {
        events: [],
        source: "error",
        error: error.message,
      };
    }

    const rows = data ?? [];
    if (rows.length === 0) {
      return { events: [], source: "empty" };
    }

    return {
      events: rows.map((r) => mapLeagueEvent(r as Record<string, unknown>)),
      source: "supabase",
    };
  } catch (err) {
    console.error("[league_events] unexpected:", err);
    return {
      events: [],
      source: "error",
      error: err instanceof Error ? err.message : "Unexpected error",
    };
  }
}

