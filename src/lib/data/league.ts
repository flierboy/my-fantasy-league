import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { mapLeague, mapOwner } from "@/lib/data/mappers";
import type { LeagueSettings, Owner } from "@/lib/types";
import {
  LEAGUE as FALLBACK_LEAGUE,
  OWNERS as FALLBACK_OWNERS,
} from "./placeholder";

export type DataSource = "supabase" | "placeholder";

/** Expected Upper Deckers roster (display names). */
const UPPER_DECKERS_NAMES = new Set([
  "Len",
  "BIGBROWNSTAIN",
  "Big Lloyd",
  "WhitsTits",
  "HAM BONE",
  "Playoff lock mase",
  "yo mama",
  "Lens daddy",
  "Starvin Marvin",
  "Benny Backshots",
]);

/**
 * True when live rows already match the Upper Deckers seed.
 * Until the SQL seed is applied in Supabase, fall back to local seed data.
 */
function isUpperDeckersRoster(owners: Owner[]): boolean {
  if (owners.length !== 10) return false;
  const names = new Set(owners.map((o) => o.display_name));
  for (const n of UPPER_DECKERS_NAMES) {
    if (!names.has(n)) return false;
  }
  return true;
}

/**
 * Load public homepage data from Supabase.
 * Falls back to Upper Deckcers local seed if env is missing, queries fail,
 * tables are empty, or live data is still the old placeholder roster.
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

    const hasOwners =
      !ownersRes.error && ownersRes.data && ownersRes.data.length > 0;

    if (!hasOwners && settingsRes.error) {
      return {
        league: FALLBACK_LEAGUE,
        owners: FALLBACK_OWNERS,
        source: "placeholder",
      };
    }

    const liveOwners = hasOwners
      ? ownersRes.data!.map((row) =>
          mapOwner(row as Record<string, unknown>)
        )
      : [];

    // Empty DB → local seed. Once any owners exist, always use live rows so
    // bulk admin edits (names, avatars, roles) show on /players and homepage.
    if (!hasOwners) {
      return {
        league: FALLBACK_LEAGUE,
        owners: FALLBACK_OWNERS,
        source: "placeholder",
      };
    }

    const league = settingsRes.data
      ? mapLeague(settingsRes.data as Record<string, unknown>)
      : FALLBACK_LEAGUE;

    // Prefer seeded copy for name/rules if DB still has a partial rename
    const normalized: LeagueSettings = {
      ...league,
      name:
        league.name.trim().toLowerCase() === "upper deckers"
          ? "Upper Deckcers"
          : league.name,
      rules_summary:
        league.rules_summary && league.rules_summary.trim().length > 0
          ? league.rules_summary
          : FALLBACK_LEAGUE.rules_summary,
      draft_at: league.draft_at || FALLBACK_LEAGUE.draft_at,
    };

    // Soft hint in logs if roster still looks like the old demo seed
    if (!isUpperDeckersRoster(liveOwners) && liveOwners.length < 8) {
      console.info(
        "[league] Live owners loaded (%d). Run seed-upper-deckers.sql if this is a fresh project.",
        liveOwners.length
      );
    }

    return {
      league: normalized,
      owners: liveOwners,
      source: "supabase",
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
