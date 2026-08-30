import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  mapDue,
  mapMatchup,
  mapPoll,
  mapPollVote,
  mapStanding,
  mapTrashPost,
  ownersByIdMap,
} from "@/lib/data/mappers";
import { getLeagueSettings, getOwners } from "@/lib/data/league";
import type {
  DuePayment,
  LeagueSettings,
  Matchup,
  Owner,
  Poll,
  PollVote,
  Standing,
  TrashTalkPost,
} from "@/lib/types";

export async function getMatchupsData(season?: number): Promise<{
  league: LeagueSettings;
  owners: Owner[];
  matchups: Matchup[];
  standings: Standing[];
  season: number;
  week: number | null;
  source: "supabase" | "fallback";
}> {
  const league = await getLeagueSettings();
  const owners = await getOwners();
  const activeSeason = season ?? league.season_year;
  const byId = ownersByIdMap(owners);

  if (!isSupabaseConfigured()) {
    return {
      league,
      owners,
      matchups: [],
      standings: emptySeasonStandings(owners, activeSeason),
      season: activeSeason,
      week: null,
      source: "fallback",
    };
  }

  try {
    const supabase = await createClient();

    const [matchupsRes, standingsRes] = await Promise.all([
      supabase
        .from("matchups")
        .select("*")
        .eq("season", activeSeason)
        .order("week", { ascending: true }),
      supabase
        .from("standings")
        .select("*")
        .eq("season", activeSeason)
        .is("week", null)
        .order("rank", { ascending: true }),
    ]);

    if (matchupsRes.error) {
      console.error("[matchups]", matchupsRes.error.message);
    }
    if (standingsRes.error) {
      console.error("[standings]", standingsRes.error.message);
    }

    const matchups = (matchupsRes.data ?? []).map((row) =>
      mapMatchup(row as Record<string, unknown>, byId)
    );

    const loaded = (standingsRes.data ?? []).map((row) =>
      mapStanding(row as Record<string, unknown>, byId)
    );

    // Current-season only: never fall back to career W-L.
    // Missing season rows → every owner at 0-0-0 / 0.0 / 0.0.
    const standings = mergeSeasonStandings(owners, activeSeason, loaded);

    const latestWeek =
      matchups.length > 0
        ? Math.max(...matchups.map((m) => m.week))
        : null;

    return {
      league,
      owners,
      matchups,
      standings,
      season: activeSeason,
      week: latestWeek,
      source: "supabase",
    };
  } catch (err) {
    console.error("[matchups] unexpected:", err);
    return {
      league,
      owners,
      matchups: [],
      standings: emptySeasonStandings(owners, activeSeason),
      season: activeSeason,
      week: null,
      source: "fallback",
    };
  }
}

/** Zero-fill current-season standings (never career franchise W-L). */
function emptySeasonStandings(owners: Owner[], season: number): Standing[] {
  return mergeSeasonStandings(owners, season, []);
}

/**
 * Ensure every owner has a season standing row, then sort by wins → PF and
 * renumber ranks 1..n.
 */
function mergeSeasonStandings(
  owners: Owner[],
  season: number,
  loaded: Standing[]
): Standing[] {
  const byOwner = new Map(loaded.map((s) => [s.owner_id, s]));
  const merged = owners.map((owner) => {
    const existing = byOwner.get(owner.id);
    if (existing) {
      return { ...existing, owner: existing.owner ?? owner };
    }
    return {
      id: `season-zero-${owner.id}`,
      season,
      week: null,
      owner_id: owner.id,
      wins: 0,
      losses: 0,
      ties: 0,
      points_for: 0,
      points_against: 0,
      rank: 0,
      owner,
    } satisfies Standing;
  });

  merged.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (a.losses !== b.losses) return a.losses - b.losses;
    if (b.points_for !== a.points_for) return b.points_for - a.points_for;
    if (a.points_against !== b.points_against) {
      return a.points_against - b.points_against;
    }
    return (a.owner?.sort_order ?? 0) - (b.owner?.sort_order ?? 0);
  });

  return merged.map((row, idx) => ({ ...row, rank: idx + 1 }));
}

export async function getDuesData(season?: number): Promise<{
  league: LeagueSettings;
  owners: Owner[];
  payments: DuePayment[];
  season: number;
  source: "supabase" | "fallback";
}> {
  const league = await getLeagueSettings();
  const owners = await getOwners();
  const activeSeason = season ?? league.season_year;
  const byId = ownersByIdMap(owners);

  if (!isSupabaseConfigured()) {
    return {
      league,
      owners,
      payments: syntheticDues(owners, league, activeSeason),
      season: activeSeason,
      source: "fallback",
    };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("due_payments")
      .select("*")
      .eq("season", activeSeason);

    if (error) {
      console.error("[dues]", error.message);
      return {
        league,
        owners,
        payments: syntheticDues(owners, league, activeSeason),
        season: activeSeason,
        source: "fallback",
      };
    }

    const rows = (data ?? []).map((row) =>
      mapDue(row as Record<string, unknown>, byId)
    );

    // Merge: ensure every owner has a row (unpaid if missing)
    const byOwner = new Map(rows.map((r) => [r.owner_id, r]));
    const payments = owners.map((owner) => {
      const existing = byOwner.get(owner.id);
      if (existing) return existing;
      return {
        id: `pending-${owner.id}`,
        owner_id: owner.id,
        season: activeSeason,
        amount_due: league.dues_amount,
        amount_paid: 0,
        paid_at: null,
        notes: null,
        owner,
      } satisfies DuePayment;
    });

    return {
      league,
      owners,
      payments,
      season: activeSeason,
      source: "supabase",
    };
  } catch (err) {
    console.error("[dues] unexpected:", err);
    return {
      league,
      owners,
      payments: syntheticDues(owners, league, activeSeason),
      season: activeSeason,
      source: "fallback",
    };
  }
}

function syntheticDues(
  owners: Owner[],
  league: LeagueSettings,
  season: number
): DuePayment[] {
  return owners.map((owner) => ({
    id: `pending-${owner.id}`,
    owner_id: owner.id,
    season,
    amount_due: league.dues_amount,
    amount_paid: 0,
    paid_at: null,
    notes: null,
    owner,
  }));
}

export async function getPollsData(): Promise<{
  polls: Poll[];
  votes: PollVote[];
  source: "supabase" | "fallback";
}> {
  if (!isSupabaseConfigured()) {
    return { polls: [], votes: [], source: "fallback" };
  }

  try {
    const supabase = await createClient();
    const [pollsRes, votesRes] = await Promise.all([
      supabase
        .from("polls")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("poll_votes").select("*"),
    ]);

    if (pollsRes.error) {
      console.error("[polls]", pollsRes.error.message);
    }
    if (votesRes.error) {
      console.error("[poll_votes]", votesRes.error.message);
    }

    return {
      polls: (pollsRes.data ?? []).map((row) =>
        mapPoll(row as Record<string, unknown>)
      ),
      votes: (votesRes.data ?? []).map((row) =>
        mapPollVote(row as Record<string, unknown>)
      ),
      source: "supabase",
    };
  } catch (err) {
    console.error("[polls] unexpected:", err);
    return { polls: [], votes: [], source: "fallback" };
  }
}

export async function getTrashTalkData(): Promise<{
  posts: TrashTalkPost[];
  owners: Owner[];
  source: "supabase" | "fallback";
}> {
  const owners = await getOwners();
  const byId = ownersByIdMap(owners);

  if (!isSupabaseConfigured()) {
    return { posts: [], owners, source: "fallback" };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("trash_talk_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[trash_talk]", error.message);
      return { posts: [], owners, source: "fallback" };
    }

    return {
      posts: (data ?? []).map((row) =>
        mapTrashPost(row as Record<string, unknown>, byId)
      ),
      owners,
      source: "supabase",
    };
  } catch (err) {
    console.error("[trash_talk] unexpected:", err);
    return { posts: [], owners, source: "fallback" };
  }
}

export async function getAdminData(): Promise<{
  league: LeagueSettings;
  owners: Owner[];
  source: "supabase" | "fallback";
}> {
  const { league, owners, source } = await (
    await import("./league")
  ).getPublicLeagueData();
  return {
    league,
    owners,
    source: source === "supabase" ? "supabase" : "fallback",
  };
}
