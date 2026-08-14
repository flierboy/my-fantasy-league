/**
 * Evaluate weekly badges from Sleeper matchup data.
 * Manual season badges (champion, commissioner, etc.) are never auto-awarded.
 */

import type { BadgeKey } from "@/lib/types";
import {
  SLEEPER_DEFAULT_LEAGUE_ID,
  fetchSleeperLeague,
  fetchSleeperMatchups,
  fetchSleeperNflState,
  fetchSleeperRosters,
  fetchSleeperUsers,
  type SleeperMatchup,
} from "@/lib/sleeper/client";
import { buildSleeperPreview, matchOwnerId } from "@/lib/sleeper/map";
import { createClient } from "@/lib/supabase/server";
import { getBadge } from "@/lib/data/badges";

/** Weekly badges we auto-evaluate (not specialty / manual season). */
export const AUTO_WEEKLY_BADGE_KEYS = [
  "apex_predator",
  "blowout_machine",
  "heavy_hitter",
  "upset_artist",
  "bench_blunder",
  "heartbreak_kid",
  "squeaked_by",
  "punching_bag",
] as const satisfies readonly BadgeKey[];

export type AutoWeeklyBadgeKey = (typeof AUTO_WEEKLY_BADGE_KEYS)[number];

export type WeeklyBadgeAward = {
  badge_key: AutoWeeklyBadgeKey;
  owner_id: string;
  owner_name: string;
  season_year: number;
  week: number;
  notes: string;
};

export type WeeklyBadgeEvalResult = {
  ok: boolean;
  error?: string;
  season_year: number;
  week: number;
  awards: WeeklyBadgeAward[];
  /** Newly inserted (not already present) */
  inserted: WeeklyBadgeAward[];
  skipped: string[];
  summary: string;
};

type TeamWeek = {
  rosterId: number;
  ownerId: string | null;
  ownerName: string;
  teamName: string;
  points: number;
  matchupId: number | null;
  opponentPoints: number | null;
  won: boolean;
  tied: boolean;
  margin: number | null;
  seasonWins: number;
  seasonLosses: number;
  starterPoints: number[];
  benchPoints: number;
  hasPlayerPoints: boolean;
};

function num(n: unknown): number {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

function starterPlayerPoints(m: SleeperMatchup): {
  starters: number[];
  bench: number;
  hasData: boolean;
} {
  const starters = m.starters ?? [];
  const pp = m.players_points ?? null;

  if (Array.isArray(m.starters_points) && m.starters_points.length > 0) {
    const starterPts = m.starters_points.map((p) => num(p));
    let bench = 0;
    if (pp) {
      const starterSet = new Set(starters.filter(Boolean));
      for (const [pid, pts] of Object.entries(pp)) {
        if (!starterSet.has(pid)) bench += num(pts);
      }
    }
    return {
      starters: starterPts,
      bench,
      hasData: starterPts.some((p) => p > 0) || bench > 0 || Boolean(pp),
    };
  }

  if (pp && starters.length > 0) {
    const starterPts = starters.map((id) => (id ? num(pp[id]) : 0));
    const starterSet = new Set(starters.filter(Boolean));
    let bench = 0;
    for (const [pid, pts] of Object.entries(pp)) {
      if (!starterSet.has(pid)) bench += num(pts);
    }
    return { starters: starterPts, bench, hasData: true };
  }

  return { starters: [], bench: 0, hasData: false };
}

export async function evaluateWeeklyBadges(opts: {
  leagueId?: string;
  week?: number;
  seasonYear?: number;
  /** If false, only compute — do not write (unused currently) */
  dryRun?: boolean;
}): Promise<WeeklyBadgeEvalResult> {
  const leagueId = opts.leagueId?.trim() || SLEEPER_DEFAULT_LEAGUE_ID;
  const skipped: string[] = [];

  try {
    const [league, users, rosters, nflState] = await Promise.all([
      fetchSleeperLeague(leagueId),
      fetchSleeperUsers(leagueId),
      fetchSleeperRosters(leagueId),
      fetchSleeperNflState().catch(() => null),
    ]);

    const preview = buildSleeperPreview(league, users, rosters);
    const seasonYear =
      opts.seasonYear ??
      Number(league.season) ??
      new Date().getFullYear();

    let week = opts.week;
    if (week == null || !Number.isFinite(week) || week < 1) {
      if (nflState) {
        const display = Number(nflState.display_week || nflState.week || 1);
        week = Math.max(1, display > 1 ? display - 1 : display);
      } else {
        week = 1;
        skipped.push("NFL state unavailable — defaulted to week 1");
      }
    }

    const matchups = await fetchSleeperMatchups(leagueId, week);
    if (!matchups.length) {
      return {
        ok: true,
        season_year: seasonYear,
        week,
        awards: [],
        inserted: [],
        skipped: [
          ...skipped,
          `No matchup data for week ${week} — skipped all weekly badges`,
        ],
        summary: `Week ${week}: no matchup data yet`,
      };
    }

    const supabase = await createClient();
    const { data: ownerRows } = await supabase
      .from("owners")
      .select("id, display_name, team_name, sleeper_username, badges");

    const owners = ownerRows ?? [];

    // Map roster → site owner
    const rosterToOwner = new Map<
      number,
      { ownerId: string | null; ownerName: string; teamName: string; wins: number; losses: number }
    >();
    for (const t of preview.teams) {
      const names = [t.teamName, t.userDisplayName ?? ""].filter(Boolean);
      const ownerId = matchOwnerId(names, owners);
      const owner = ownerId
        ? owners.find((o) => o.id === ownerId)
        : undefined;
      rosterToOwner.set(t.rosterId, {
        ownerId,
        ownerName: owner?.display_name ?? t.userDisplayName ?? t.teamName,
        teamName: t.teamName,
        wins: t.wins,
        losses: t.losses,
      });
    }

    // Pair opponents by matchup_id
    const byMatchup = new Map<number, SleeperMatchup[]>();
    for (const m of matchups) {
      if (m.matchup_id == null) continue;
      const list = byMatchup.get(m.matchup_id) ?? [];
      list.push(m);
      byMatchup.set(m.matchup_id, list);
    }

    const teams: TeamWeek[] = [];
    for (const m of matchups) {
      const meta = rosterToOwner.get(m.roster_id);
      const points = num(m.custom_points ?? m.points);
      let opponentPoints: number | null = null;
      if (m.matchup_id != null) {
        const pair = byMatchup.get(m.matchup_id) ?? [];
        const opp = pair.find((x) => x.roster_id !== m.roster_id);
        if (opp) opponentPoints = num(opp.custom_points ?? opp.points);
      }
      const won =
        opponentPoints != null && points > opponentPoints + 1e-9;
      const tied =
        opponentPoints != null && Math.abs(points - opponentPoints) < 1e-9;
      const margin =
        opponentPoints != null ? points - opponentPoints : null;
      const sp = starterPlayerPoints(m);

      teams.push({
        rosterId: m.roster_id,
        ownerId: meta?.ownerId ?? null,
        ownerName: meta?.ownerName ?? `Roster ${m.roster_id}`,
        teamName: meta?.teamName ?? `Roster ${m.roster_id}`,
        points,
        matchupId: m.matchup_id,
        opponentPoints,
        won,
        tied,
        margin,
        seasonWins: meta?.wins ?? 0,
        seasonLosses: meta?.losses ?? 0,
        starterPoints: sp.starters,
        benchPoints: sp.bench,
        hasPlayerPoints: sp.hasData,
      });
    }

    const withOwners = teams.filter((t) => t.ownerId);
    if (withOwners.length === 0) {
      skipped.push("No matchups matched to site owners — check Sleeper names");
    }

    const awards: WeeklyBadgeAward[] = [];
    const push = (
      key: AutoWeeklyBadgeKey,
      team: TeamWeek,
      notes: string
    ) => {
      if (!team.ownerId) {
        skipped.push(`${getBadge(key).label}: winner unmatched to site owner`);
        return;
      }
      awards.push({
        badge_key: key,
        owner_id: team.ownerId,
        owner_name: team.ownerName,
        season_year: seasonYear,
        week,
        notes,
      });
    };

    // Require some scoring to avoid awarding on empty pre-season weeks
    const anyScored = teams.some((t) => t.points > 0);
    if (!anyScored) {
      skipped.push(
        `Week ${week}: all scores are 0 — skipped auto badges (week not complete?)`
      );
      return {
        ok: true,
        season_year: seasonYear,
        week,
        awards: [],
        inserted: [],
        skipped,
        summary: `Week ${week}: no scores yet`,
      };
    }

    // Apex Predator — highest total points
    {
      const sorted = [...teams].sort((a, b) => b.points - a.points);
      const top = sorted[0];
      if (top && top.points > 0) {
        push(
          "apex_predator",
          top,
          `${top.points.toFixed(1)} pts (highest in week ${week})`
        );
      } else {
        skipped.push("Apex Predator: no positive scores");
      }
    }

    // Blowout Machine — largest margin of victory
    {
      const winners = teams.filter(
        (t) => t.won && t.margin != null && t.margin > 0
      );
      if (winners.length) {
        winners.sort((a, b) => (b.margin ?? 0) - (a.margin ?? 0));
        const top = winners[0];
        push(
          "blowout_machine",
          top,
          `Won by ${(top.margin ?? 0).toFixed(1)} (largest margin)`
        );
      } else {
        skipped.push("Blowout Machine: no completed matchups with a winner");
      }
    }

    // Heavy Hitter — max single starter points
    {
      const withStarters = teams.filter(
        (t) => t.hasPlayerPoints && t.starterPoints.length > 0
      );
      if (withStarters.length) {
        let best: TeamWeek | null = null;
        let bestPts = -1;
        for (const t of withStarters) {
          const maxStarter = Math.max(...t.starterPoints, 0);
          if (maxStarter > bestPts) {
            bestPts = maxStarter;
            best = t;
          }
        }
        if (best && bestPts > 0) {
          push(
            "heavy_hitter",
            best,
            `Starter scored ${bestPts.toFixed(1)} (week high)`
          );
        } else {
          skipped.push("Heavy Hitter: no starter point totals > 0");
        }
      } else {
        skipped.push(
          "Heavy Hitter: player-level points not available from Sleeper for this week"
        );
      }
    }

    // Upset Artist — winner with worst season record (fewest wins, then most losses)
    {
      const winners = teams.filter((t) => t.won);
      if (winners.length) {
        winners.sort((a, b) => {
          if (a.seasonWins !== b.seasonWins) return a.seasonWins - b.seasonWins;
          return b.seasonLosses - a.seasonLosses;
        });
        const underdog = winners[0];
        // Only award if at least one team has a non-zero record spread
        const hasSpread =
          winners.some((w) => w.seasonWins > 0 || w.seasonLosses > 0);
        if (hasSpread) {
          push(
            "upset_artist",
            underdog,
            `Won as ${underdog.seasonWins}-${underdog.seasonLosses} (lowest rank among winners)`
          );
        } else {
          skipped.push(
            "Upset Artist: season ranks all 0-0 — skipped until standings exist"
          );
        }
      } else {
        skipped.push("Upset Artist: no winners this week");
      }
    }

    // Bench Blunder — most bench points
    {
      const withBench = teams.filter((t) => t.hasPlayerPoints);
      if (withBench.length) {
        withBench.sort((a, b) => b.benchPoints - a.benchPoints);
        const top = withBench[0];
        if (top.benchPoints > 0) {
          push(
            "bench_blunder",
            top,
            `${top.benchPoints.toFixed(1)} pts left on bench`
          );
        } else {
          skipped.push("Bench Blunder: no bench points recorded");
        }
      } else {
        skipped.push(
          "Bench Blunder: bench/player points not available from Sleeper"
        );
      }
    }

    // Heartbreak Kid — 2nd-highest scorer overall who still lost
    {
      const sorted = [...teams].sort((a, b) => b.points - a.points);
      const second = sorted[1];
      if (
        second &&
        second.opponentPoints != null &&
        !second.won &&
        !second.tied
      ) {
        push(
          "heartbreak_kid",
          second,
          `2nd-highest scorer (${second.points.toFixed(1)}) and still lost`
        );
      } else {
        skipped.push(
          "Heartbreak Kid: 2nd-highest scorer did not lose (or incomplete)"
        );
      }
    }

    // Squeaked By — won by < 1.0
    {
      const squeakers = teams.filter(
        (t) => t.won && t.margin != null && t.margin > 0 && t.margin < 1
      );
      if (squeakers.length) {
        // Award all who squeaked, or just the closest? Spec says the badge for the condition —
        // award each unique winner under 1 pt (usually 0–1 teams). Prefer closest win if many.
        squeakers.sort((a, b) => (a.margin ?? 0) - (b.margin ?? 0));
        for (const t of squeakers) {
          push(
            "squeaked_by",
            t,
            `Won by ${(t.margin ?? 0).toFixed(2)} (< 1.0)`
          );
        }
      } else {
        skipped.push("Squeaked By: no wins under 1.0 point");
      }
    }

    // Punching Bag — surrendered most points (opponent scored most against them)
    {
      const withOpp = teams.filter((t) => t.opponentPoints != null);
      if (withOpp.length) {
        withOpp.sort(
          (a, b) => (b.opponentPoints ?? 0) - (a.opponentPoints ?? 0)
        );
        const bag = withOpp[0];
        if ((bag.opponentPoints ?? 0) > 0) {
          push(
            "punching_bag",
            bag,
            `Allowed ${(bag.opponentPoints ?? 0).toFixed(1)} pts against`
          );
        } else {
          skipped.push("Punching Bag: no points against recorded");
        }
      } else {
        skipped.push("Punching Bag: no opponent pairings");
      }
    }

    // Dedupe awards by badge_key+owner (keep first notes)
    const deduped: WeeklyBadgeAward[] = [];
    const seen = new Set<string>();
    for (const a of awards) {
      const k = `${a.badge_key}:${a.owner_id}:${a.week}`;
      if (seen.has(k)) continue;
      seen.add(k);
      deduped.push(a);
    }

    // Persist (skip if already awarded this week)
    const inserted: WeeklyBadgeAward[] = [];
    if (!opts.dryRun && deduped.length > 0) {
      for (const a of deduped) {
        const { data: existing, error: existErr } = await supabase
          .from("badge_awards")
          .select("id")
          .eq("owner_id", a.owner_id)
          .eq("badge_key", a.badge_key)
          .eq("season_year", a.season_year)
          .eq("week", a.week)
          .maybeSingle();

        if (existErr) {
          if (
            existErr.message.includes("does not exist") ||
            existErr.code === "42P01"
          ) {
            skipped.push(
              "badge_awards table missing — run supabase/migrate-badge-awards.sql"
            );
            break;
          }
          skipped.push(`${a.badge_key}: lookup failed (${existErr.message})`);
          continue;
        }
        if (existing?.id) {
          continue; // already awarded this week
        }

        const { error } = await supabase.from("badge_awards").insert({
          owner_id: a.owner_id,
          badge_key: a.badge_key,
          season_year: a.season_year,
          week: a.week,
          notes: a.notes,
        });
        if (error) {
          if (
            error.message.includes("does not exist") ||
            error.code === "42P01"
          ) {
            skipped.push(
              "badge_awards table missing — run supabase/migrate-badge-awards.sql"
            );
            break;
          }
          // Unique race
          if (error.code === "23505") continue;
          skipped.push(`${a.badge_key}: insert failed (${error.message})`);
          continue;
        }
        inserted.push(a);

        // Also add badge key to owners.badges for chip display (unique)
        const owner = owners.find((o) => o.id === a.owner_id);
        if (owner) {
          const current = Array.isArray(owner.badges)
            ? (owner.badges as string[])
            : [];
          if (!current.includes(a.badge_key)) {
            const next = [...current, a.badge_key];
            await supabase
              .from("owners")
              .update({ badges: next })
              .eq("id", a.owner_id);
            owner.badges = next;
          }
        }
      }
    }

    const summaryParts =
      inserted.length > 0
        ? inserted.map(
            (a) =>
              `${getBadge(a.badge_key).label} → ${a.owner_name}`
          )
        : deduped.length > 0
          ? deduped.map(
              (a) =>
                `${getBadge(a.badge_key).label} → ${a.owner_name} (already had)`
            )
          : ["no new awards"];

    return {
      ok: true,
      season_year: seasonYear,
      week,
      awards: deduped,
      inserted,
      skipped: [...new Set(skipped)],
      summary: `Week ${week}: ${summaryParts.join(", ")}`,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Badge evaluation failed",
      season_year: opts.seasonYear ?? new Date().getFullYear(),
      week: opts.week ?? 0,
      awards: [],
      inserted: [],
      skipped,
      summary: "Badge evaluation failed",
    };
  }
}
