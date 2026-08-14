/**
 * Write weekly matchup rows from Sleeper into public.matchups.
 * Replaces any existing rows for that season+week (Sleeper preferred).
 */

import {
  fetchSleeperMatchups,
  type SleeperMatchup,
} from "@/lib/sleeper/client";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type WeeklyMatchupSyncResult = {
  week: number;
  season: number;
  matchupsWritten: number;
  skippedPairs: number;
  notes: string[];
};

function scoreOf(m: SleeperMatchup): number {
  const custom = m.custom_points;
  if (custom != null && Number.isFinite(Number(custom))) return Number(custom);
  return Number(m.points ?? 0) || 0;
}

/**
 * @param rosterToOwner map of Sleeper roster_id → site owners.id
 */
export async function syncWeeklyMatchupsFromSleeper(opts: {
  supabase: Supabase;
  leagueId: string;
  season: number;
  week: number;
  rosterToOwner: Map<number, string>;
  /** When true, treat scores as final for is_complete */
  weekIsComplete?: boolean;
}): Promise<WeeklyMatchupSyncResult> {
  const notes: string[] = [];
  const { supabase, leagueId, season, week, rosterToOwner } = opts;

  let rows: SleeperMatchup[] = [];
  try {
    rows = await fetchSleeperMatchups(leagueId, week);
  } catch (err) {
    return {
      week,
      season,
      matchupsWritten: 0,
      skippedPairs: 0,
      notes: [
        `Matchups fetch failed for week ${week}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      ],
    };
  }

  if (!rows.length) {
    return {
      week,
      season,
      matchupsWritten: 0,
      skippedPairs: 0,
      notes: [`No Sleeper matchup data for week ${week}`],
    };
  }

  // Pair by matchup_id
  const byMatchup = new Map<number, SleeperMatchup[]>();
  for (const m of rows) {
    if (m.matchup_id == null) continue;
    const list = byMatchup.get(m.matchup_id) ?? [];
    list.push(m);
    byMatchup.set(m.matchup_id, list);
  }

  type Pair = {
    home_owner_id: string;
    away_owner_id: string;
    home_score: number;
    away_score: number;
  };
  const pairs: Pair[] = [];
  let skippedPairs = 0;

  for (const [, group] of byMatchup) {
    if (group.length < 2) {
      skippedPairs += 1;
      continue;
    }
    const [a, b] = group;
    const ownerA = rosterToOwner.get(a.roster_id);
    const ownerB = rosterToOwner.get(b.roster_id);
    if (!ownerA || !ownerB || ownerA === ownerB) {
      skippedPairs += 1;
      continue;
    }
    // Deterministic home/away: lower roster_id = home
    const home = a.roster_id < b.roster_id ? a : b;
    const away = a.roster_id < b.roster_id ? b : a;
    const homeOwner =
      home.roster_id === a.roster_id ? ownerA : ownerB;
    const awayOwner =
      away.roster_id === a.roster_id ? ownerA : ownerB;

    pairs.push({
      home_owner_id: homeOwner,
      away_owner_id: awayOwner,
      home_score: scoreOf(home),
      away_score: scoreOf(away),
    });
  }

  if (!pairs.length) {
    return {
      week,
      season,
      matchupsWritten: 0,
      skippedPairs,
      notes: [
        `Week ${week}: no matchup pairs mapped to site owners (check Sleeper name matching)`,
      ],
    };
  }

  // Prefer Sleeper: wipe week then insert
  const { error: delErr } = await supabase
    .from("matchups")
    .delete()
    .eq("season", season)
    .eq("week", week);

  if (delErr) {
    notes.push(`Could not clear week ${week} matchups: ${delErr.message}`);
  }

  const isComplete =
    opts.weekIsComplete === true ||
    pairs.every((p) => p.home_score > 0 || p.away_score > 0);

  const insertRows = pairs.map((p) => ({
    season,
    week,
    home_owner_id: p.home_owner_id,
    away_owner_id: p.away_owner_id,
    home_score: p.home_score,
    away_score: p.away_score,
    is_playoff: false,
    is_complete: isComplete,
  }));

  const { error: insErr } = await supabase.from("matchups").insert(insertRows);
  if (insErr) {
    notes.push(`Matchups insert failed: ${insErr.message}`);
    return {
      week,
      season,
      matchupsWritten: 0,
      skippedPairs,
      notes,
    };
  }

  notes.push(
    `Week ${week}: wrote ${insertRows.length} matchup${insertRows.length === 1 ? "" : "s"} from Sleeper`
  );
  if (skippedPairs) {
    notes.push(`${skippedPairs} pair(s) skipped (bye / unmatched roster)`);
  }

  return {
    week,
    season,
    matchupsWritten: insertRows.length,
    skippedPairs,
    notes,
  };
}

/** Rank standings by W-L then PF (1-based). */
export function computeStandingsRanks(
  teams: {
    ownerId: string;
    wins: number;
    losses: number;
    ties: number;
    pointsFor: number;
    pointsAgainst: number;
  }[]
): Map<string, number> {
  const sorted = [...teams].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (a.losses !== b.losses) return a.losses - b.losses;
    if (b.pointsFor !== a.pointsFor) return b.pointsFor - a.pointsFor;
    return a.pointsAgainst - b.pointsAgainst;
  });
  const ranks = new Map<string, number>();
  sorted.forEach((t, i) => ranks.set(t.ownerId, i + 1));
  return ranks;
}
