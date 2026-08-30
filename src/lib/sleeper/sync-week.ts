/**
 * Write weekly matchup rows from Sleeper into public.matchups.
 * Replaces any existing rows for that season+week (Sleeper preferred).
 * Persists starting lineups + bench when Sleeper provides starters[].
 */

import {
  fetchSleeperMatchups,
  type SleeperMatchup,
  type SleeperNflPlayer,
} from "@/lib/sleeper/client";
import { buildLineupFromSleeperMatchup } from "@/lib/sleeper/lineups";
import { getSleeperNflPlayersMap } from "@/lib/sleeper/players";
import type { LineupPlayer } from "@/lib/types";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type WeeklyMatchupSyncResult = {
  week: number;
  season: number;
  matchupsWritten: number;
  skippedPairs: number;
  lineupsFilled: number;
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
  /** League roster_positions for slot labels (QB, RB, FLEX, …) */
  rosterPositions?: string[] | null;
  /** When true, treat scores as final for is_complete */
  weekIsComplete?: boolean;
}): Promise<WeeklyMatchupSyncResult> {
  const notes: string[] = [];
  const { supabase, leagueId, season, week, rosterToOwner } = opts;
  const rosterPositions = opts.rosterPositions ?? null;

  let rows: SleeperMatchup[] = [];
  try {
    rows = await fetchSleeperMatchups(leagueId, week);
  } catch (err) {
    return {
      week,
      season,
      matchupsWritten: 0,
      skippedPairs: 0,
      lineupsFilled: 0,
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
      lineupsFilled: 0,
      notes: [`No Sleeper matchup data for week ${week}`],
    };
  }

  let playersById = new Map<string, SleeperNflPlayer>();
  try {
    playersById = await getSleeperNflPlayersMap();
    notes.push(`NFL player cache loaded (${playersById.size} ids)`);
  } catch (err) {
    notes.push(
      `Player name cache failed — lineups will use ids only: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
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
    home_starters: LineupPlayer[];
    away_starters: LineupPlayer[];
    home_bench: LineupPlayer[];
    away_bench: LineupPlayer[];
  };
  const pairs: Pair[] = [];
  let skippedPairs = 0;
  let lineupsFilled = 0;

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

    const homeLineup = buildLineupFromSleeperMatchup(
      home,
      rosterPositions,
      playersById
    );
    const awayLineup = buildLineupFromSleeperMatchup(
      away,
      rosterPositions,
      playersById
    );

    if (homeLineup.starters.some((s) => s.player_id)) lineupsFilled += 1;
    if (awayLineup.starters.some((s) => s.player_id)) lineupsFilled += 1;

    pairs.push({
      home_owner_id: homeOwner,
      away_owner_id: awayOwner,
      home_score: scoreOf(home),
      away_score: scoreOf(away),
      home_starters: homeLineup.starters,
      away_starters: awayLineup.starters,
      home_bench: homeLineup.bench,
      away_bench: awayLineup.bench,
    });
  }

  if (!pairs.length) {
    return {
      week,
      season,
      matchupsWritten: 0,
      skippedPairs,
      lineupsFilled: 0,
      notes: [
        ...notes,
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
    home_starters: p.home_starters,
    away_starters: p.away_starters,
    home_bench: p.home_bench,
    away_bench: p.away_bench,
  }));

  const { error: insErr } = await supabase.from("matchups").insert(insertRows);
  if (insErr) {
    // Fallback if jsonb columns not migrated yet — insert scores only
    if (
      /home_starters|away_starters|home_bench|away_bench|column/i.test(
        insErr.message
      )
    ) {
      notes.push(
        `Lineup columns missing — run supabase/migrate-matchup-lineups.sql (${insErr.message})`
      );
      const scoreOnly = pairs.map((p) => ({
        season,
        week,
        home_owner_id: p.home_owner_id,
        away_owner_id: p.away_owner_id,
        home_score: p.home_score,
        away_score: p.away_score,
        is_playoff: false,
        is_complete: isComplete,
      }));
      const { error: retryErr } = await supabase
        .from("matchups")
        .insert(scoreOnly);
      if (retryErr) {
        notes.push(`Matchups insert failed: ${retryErr.message}`);
        return {
          week,
          season,
          matchupsWritten: 0,
          skippedPairs,
          lineupsFilled: 0,
          notes,
        };
      }
      notes.push(
        `Week ${week}: wrote ${scoreOnly.length} matchup score(s) without lineups`
      );
      return {
        week,
        season,
        matchupsWritten: scoreOnly.length,
        skippedPairs,
        lineupsFilled: 0,
        notes,
      };
    }

    notes.push(`Matchups insert failed: ${insErr.message}`);
    return {
      week,
      season,
      matchupsWritten: 0,
      skippedPairs,
      lineupsFilled: 0,
      notes,
    };
  }

  notes.push(
    `Week ${week}: wrote ${insertRows.length} matchup${insertRows.length === 1 ? "" : "s"} from Sleeper (${lineupsFilled} side(s) with starters)`
  );
  if (skippedPairs) {
    notes.push(`${skippedPairs} pair(s) skipped (bye / unmatched roster)`);
  }

  return {
    week,
    season,
    matchupsWritten: insertRows.length,
    skippedPairs,
    lineupsFilled,
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
