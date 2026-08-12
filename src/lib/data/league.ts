import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { mapLeague, mapOwner } from "@/lib/data/mappers";
import type { LeagueSettings, Owner } from "@/lib/types";
import {
  LEAGUE as FALLBACK_LEAGUE,
  OWNERS as FALLBACK_OWNERS,
} from "./placeholder";

export type DataSource = "supabase" | "placeholder";

/**
 * Load public homepage data from Supabase.
 * Falls back to local placeholders if env is missing, queries fail,
 * or the owners table is empty.
 */
export async function getPublicLeagueData(): Promise<{
  league: LeagueSettings;
  owners: Owner[];
  source: DataSource;
}> {
  if (!isSupabaseConfigured()) {
    return {
      league: FALLBACK_LEAGUE,
      owners: FALLBACK_OWNERS,
      source: "placeholder",
    };
  }

  try {
    const supabase = await createClient();

    const [settingsRes, ownersRes] = await Promise.all([
      supabase.from("league_settings").select("*").eq("id", 1).maybeSingle(),
      supabase
        .from("owners")
        .select("*")
        .order("sort_order", { ascending: true }),
    ]);

    if (settingsRes.error) {
      console.error(
        "[league] league_settings error:",
        settingsRes.error.message
      );
    }
    if (ownersRes.error) {
      console.error("[league] owners error:", ownersRes.error.message);
    }

    // Empty owners table → placeholders (schema not seeded yet)
    const hasOwners =
      !ownersRes.error && ownersRes.data && ownersRes.data.length > 0;

    if (!hasOwners && settingsRes.error) {
      return {
        league: FALLBACK_LEAGUE,
        owners: FALLBACK_OWNERS,
        source: "placeholder",
      };
    }

    const league = settingsRes.data
      ? mapLeague(settingsRes.data as Record<string, unknown>)
      : FALLBACK_LEAGUE;

    const owners = hasOwners
      ? ownersRes.data!.map((row) =>
          mapOwner(row as Record<string, unknown>)
        )
      : FALLBACK_OWNERS;

    return {
      league,
      owners,
      source: hasOwners || settingsRes.data ? "supabase" : "placeholder",
    };
  } catch (err) {
    console.error("[league] unexpected error:", err);
    return {
      league: FALLBACK_LEAGUE,
      owners: FALLBACK_OWNERS,
      source: "placeholder",
    };
  }
}

/** League settings only (dashboard shell, etc.). */
export async function getLeagueSettings(): Promise<LeagueSettings> {
  const { league } = await getPublicLeagueData();
  return league;
}

/** Owners list for dashboard pages. */
export async function getOwners(): Promise<Owner[]> {
  const { owners } = await getPublicLeagueData();
  return owners;
}
