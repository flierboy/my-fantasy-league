import {
  SLEEPER_DEFAULT_LEAGUE_ID,
  fetchSleeperLeague,
  fetchSleeperMatchups,
  fetchSleeperNflState,
  fetchSleeperRosters,
  fetchSleeperTransactions,
  fetchSleeperUsers,
  type SleeperMatchup,
  type SleeperTransaction,
} from "@/lib/sleeper/client";
import { buildSleeperPreview, matchOwnerId } from "@/lib/sleeper/map";
import { createClient } from "@/lib/supabase/server";
import {
  weeklyResultsEmailHtml,
  type WeeklyMatchupLine,
  type WeeklyStandingLine,
  type WeeklyWaiverLine,
} from "./templates";
import { getOwnerEmailRecipients } from "./recipients";
import { sendEmailToOwners, type SendBatchResult } from "./send";

export type WeeklyEmailPayload = {
  week: number;
  season: number;
  leagueName: string;
  matchups: WeeklyMatchupLine[];
  standings: WeeklyStandingLine[];
  waivers: WeeklyWaiverLine[];
  notes: string[];
};

/**
 * Build weekly results content from Sleeper (+ optional site standings fallback).
 * Expandable once we store live matchups in our own tables.
 */
export async function buildWeeklyResultsPayload(opts: {
  leagueId?: string;
  week?: number;
}): Promise<{ ok: true; data: WeeklyEmailPayload } | { ok: false; error: string }> {
  const leagueId = opts.leagueId?.trim() || SLEEPER_DEFAULT_LEAGUE_ID;
  const notes: string[] = [];

  try {
    const [league, users, rosters, nflState] = await Promise.all([
      fetchSleeperLeague(leagueId),
      fetchSleeperUsers(leagueId),
      fetchSleeperRosters(leagueId),
      fetchSleeperNflState().catch(() => null),
    ]);

    const preview = buildSleeperPreview(league, users, rosters);
    const season = Number(league.season) || new Date().getFullYear();

    // Prefer explicit week; else last completed week (display_week - 1 during season)
    let week = opts.week;
    if (week == null || !Number.isFinite(week) || week < 1) {
      if (nflState) {
        const display = Number(nflState.display_week || nflState.week || 1);
        // If we're mid-week, results email usually targets previous week
        week = Math.max(1, display > 1 ? display - 1 : display);
        notes.push(
          `Using week ${week} (NFL display week ${display}, season_type ${nflState.season_type}).`
        );
      } else {
        week = 1;
        notes.push("NFL state unavailable — defaulted to week 1.");
      }
    }

    const [matchupRows, transactions] = await Promise.all([
      fetchSleeperMatchups(leagueId, week).catch((e) => {
        notes.push(
          `Matchups fetch failed: ${e instanceof Error ? e.message : String(e)}`
        );
        return [] as SleeperMatchup[];
      }),
      fetchSleeperTransactions(leagueId, week).catch((e) => {
        notes.push(
          `Transactions fetch failed: ${e instanceof Error ? e.message : String(e)}`
        );
        return [] as SleeperTransaction[];
      }),
    ]);

    const teamByRoster = new Map(
      preview.teams.map((t) => [t.rosterId, t] as const)
    );

    // Pair matchups by matchup_id
    const byMatchup = new Map<number, SleeperMatchup[]>();
    for (const m of matchupRows) {
      if (m.matchup_id == null) continue;
      const list = byMatchup.get(m.matchup_id) ?? [];
      list.push(m);
      byMatchup.set(m.matchup_id, list);
    }

    const matchups: WeeklyMatchupLine[] = [];
    for (const [, pair] of byMatchup) {
      if (pair.length < 2) {
        // Bye or incomplete pair — show single if present
        const a = pair[0];
        if (!a) continue;
        const team = teamByRoster.get(a.roster_id);
        matchups.push({
          homeName: team?.teamName ?? `Roster ${a.roster_id}`,
          awayName: "BYE",
          homeScore: a.points ?? null,
          awayScore: null,
        });
        continue;
      }
      const [left, right] = pair;
      const tL = teamByRoster.get(left.roster_id);
      const tR = teamByRoster.get(right.roster_id);
      matchups.push({
        awayName: tL?.teamName ?? `Roster ${left.roster_id}`,
        homeName: tR?.teamName ?? `Roster ${right.roster_id}`,
        awayScore: left.points ?? null,
        homeScore: right.points ?? null,
      });
    }

    // Standings from current roster records (season-to-date after sync)
    const standings: WeeklyStandingLine[] = preview.teams
      .filter((t) => !t.openSlot)
      .map((t, i) => ({
        rank: i + 1,
        name: t.teamName,
        record: `${t.wins}-${t.losses}-${t.ties}`,
        pointsFor: t.pointsFor,
      }))
      .sort((a, b) => {
        // re-sort by wins then PF for rank accuracy
        const aw = Number(a.record.split("-")[0]);
        const bw = Number(b.record.split("-")[0]);
        if (bw !== aw) return bw - aw;
        return b.pointsFor - a.pointsFor;
      })
      .map((s, i) => ({ ...s, rank: i + 1 }));

    // Waivers / free agent adds+drops (complete only)
    const waivers: WeeklyWaiverLine[] = [];
    const completeTx = transactions.filter(
      (t) =>
        t.status === "complete" &&
        (t.type === "waiver" || t.type === "free_agent")
    );

    for (const tx of completeTx) {
      const rosterIds = tx.roster_ids ?? [];
      // Prefer roster from adds/drops values
      const fromAdds = tx.adds ? Object.values(tx.adds) : [];
      const fromDrops = tx.drops ? Object.values(tx.drops) : [];
      const rid =
        fromAdds[0] ?? fromDrops[0] ?? rosterIds[0] ?? null;
      const team =
        rid != null ? teamByRoster.get(Number(rid)) : undefined;
      const teamName = team?.teamName ?? (rid != null ? `Roster ${rid}` : "Unknown");

      const addIds = tx.adds ? Object.keys(tx.adds) : [];
      const dropIds = tx.drops ? Object.keys(tx.drops) : [];
      const parts: string[] = [];
      if (addIds.length) {
        parts.push(`added ${addIds.map(formatPlayerId).join(", ")}`);
      }
      if (dropIds.length) {
        parts.push(`dropped ${dropIds.map(formatPlayerId).join(", ")}`);
      }
      if (!parts.length) continue;
      waivers.push({
        teamName,
        summary: `${tx.type}: ${parts.join("; ")}`,
      });
    }

    if (matchups.length === 0) {
      notes.push(
        "No matchup pairs found — season may not have scores for this week yet."
      );
    }
    if (waivers.length === 0) {
      notes.push("Waiver section empty for this week (normal if none completed).");
    }

    // Optional: try to resolve nicer names from site owners for standings
    try {
      const supabase = await createClient();
      const { data: owners } = await supabase
        .from("owners")
        .select("id, display_name, team_name, sleeper_username");
      if (owners?.length) {
        for (const s of standings) {
          const id = matchOwnerId([s.name], owners);
          if (id) {
            const o = owners.find((x) => x.id === id);
            if (o?.display_name) {
              s.name = o.team_name
                ? `${o.display_name} (${o.team_name})`
                : o.display_name;
            }
          }
        }
        for (const m of matchups) {
          for (const side of ["homeName", "awayName"] as const) {
            if (m[side] === "BYE") continue;
            const id = matchOwnerId([m[side]], owners);
            if (id) {
              const o = owners.find((x) => x.id === id);
              if (o) {
                m[side] = o.team_name || o.display_name;
              }
            }
          }
        }
      }
    } catch {
      // non-fatal
    }

    // League name from site settings if available
    let leagueName = preview.leagueName || "Upper Deckers";
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("league_settings")
        .select("name")
        .eq("id", 1)
        .maybeSingle();
      if (data?.name) leagueName = String(data.name);
    } catch {
      // ignore
    }

    return {
      ok: true,
      data: {
        week,
        season,
        leagueName,
        matchups,
        standings,
        waivers,
        notes,
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to build weekly email",
    };
  }
}

function formatPlayerId(id: string): string {
  // Sleeper player IDs are numeric strings; DEF often like "SF"
  if (/^\d+$/.test(id)) return `player #${id}`;
  return id;
}

export async function sendWeeklyResultsEmailToOwners(opts: {
  leagueId?: string;
  week?: number;
}): Promise<
  SendBatchResult & {
    week?: number;
    season?: number;
    notes?: string[];
  }
> {
  const built = await buildWeeklyResultsPayload(opts);
  if (!built.ok) {
    return {
      ok: false,
      sent: 0,
      failed: 0,
      skipped: 0,
      errors: [built.error],
      message: built.error,
    };
  }

  const { data } = built;
  const content = weeklyResultsEmailHtml({
    leagueName: data.leagueName,
    week: data.week,
    season: data.season,
    matchups: data.matchups,
    standings: data.standings,
    waivers: data.waivers,
  });

  const { recipients, error } = await getOwnerEmailRecipients();
  if (error) {
    return {
      ok: false,
      sent: 0,
      failed: 0,
      skipped: 0,
      errors: [error],
      message: `Failed to load recipients: ${error}`,
      week: data.week,
      season: data.season,
      notes: data.notes,
    };
  }

  const result = await sendEmailToOwners({
    recipients,
    subject: content.subject,
    html: content.html,
    text: content.text,
    tags: [
      { name: "category", value: "weekly_results" },
      { name: "week", value: String(data.week) },
    ],
  });

  return {
    ...result,
    week: data.week,
    season: data.season,
    notes: data.notes,
  };
}
