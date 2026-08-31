"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  SLEEPER_DEFAULT_LEAGUE_ID,
  fetchSleeperLeague,
  fetchSleeperNflState,
  fetchSleeperRosters,
  fetchSleeperUsers,
} from "@/lib/sleeper/client";
import { buildSleeperPreview, matchOwnerId } from "@/lib/sleeper/map";
import {
  computeStandingsRanks,
  syncWeeklyMatchupsFromSleeper,
} from "@/lib/sleeper/sync-week";
import { syncSleeperDraftPicks } from "@/lib/sleeper/sync-draft";
import { sendWeeklyResultsEmailToOwners } from "@/lib/email/weekly";
import { evaluateWeeklyBadges } from "@/lib/badges/weekly-eval";
import type { ActionResult } from "./types";
import { fail, ok } from "./types";
import { requireAdmin } from "./utils";

export type SleeperSyncSummary = {
  ok: boolean;
  error?: string;
  leagueId?: string;
  leagueName?: string;
  season?: string;
  status?: string;
  joinedUsers?: number;
  openRosterSlots?: number;
  teamsFound?: number;
  ownersUpdated?: number;
  ownersCreated?: number;
  ownersUnmatched?: string[];
  standingsUpserted?: number;
  settingsUpdated?: boolean;
  /** Weekly matchups written for the synced week */
  matchupsWritten?: number;
  /** Season draft picks imported (0 if already filled / skipped) */
  draftPicksWritten?: number;
  /** Week number used for matchups / badges / email */
  syncedWeek?: number;
  lastSyncAt?: string;
  teamPreview?: {
    teamName: string;
    userDisplayName: string | null;
    record: string;
    matchedOwner?: string;
  }[];
  notes?: string[];
  /** Set when “Email weekly results after sync” is checked */
  weeklyEmail?: {
    sent: number;
    failed: number;
    message: string;
    week?: number;
  };
  /** Weekly badge auto-award summary */
  badgeAwards?: {
    week?: number;
    summary: string;
    awarded: string[];
    skipped: string[];
  };
};

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/matchups");
  revalidatePath("/drafts");
  revalidatePath("/history");
  revalidatePath("/players");
  revalidatePath("/badges");
  revalidatePath("/admin");
  revalidatePath("/admin/sleeper");
  revalidatePath("/admin/drafts");
  revalidatePath("/admin/owners");
  revalidatePath("/admin/settings");
}

/**
 * Manual Sleeper sync — league info, users/teams, standings into site tables.
 * Admin only. Not automatic/live.
 */
export async function syncSleeperLeague(
  formData: FormData
): Promise<SleeperSyncSummary> {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false, error: gate.error };

  const leagueId =
    String(formData.get("league_id") ?? "").trim() ||
    SLEEPER_DEFAULT_LEAGUE_ID;
  const createMissing = formData.get("create_missing") === "on";
  const updateLeagueName = formData.get("update_league_name") === "on";
  const updateRecords = formData.get("update_records") !== "off"; // default on
  const emailWeeklyAfterSync =
    formData.get("email_weekly_after_sync") === "on";
  const autoAwardBadges =
    formData.get("auto_award_weekly_badges") === "on" ||
    formData.get("auto_award_weekly_badges") === "true";
  // Sync weekly matchups (default on)
  const syncMatchups = formData.get("sync_matchups") !== "off";
  const weeklyWeekRaw = String(formData.get("weekly_week") ?? "").trim();
  const weeklyWeekParsed = weeklyWeekRaw
    ? Number.parseInt(weeklyWeekRaw, 10)
    : undefined;

  const notes: string[] = [];

  try {
    const [league, users, rosters, nflState] = await Promise.all([
      fetchSleeperLeague(leagueId),
      fetchSleeperUsers(leagueId),
      fetchSleeperRosters(leagueId),
      fetchSleeperNflState().catch(() => null),
    ]);

    const preview = buildSleeperPreview(league, users, rosters);
    const seasonYear = Number(league.season) || new Date().getFullYear();

    // Resolve week for matchups / badges / email
    const displayWeek = nflState
      ? Number(nflState.display_week || nflState.week || 1)
      : 1;
    const syncedWeek =
      weeklyWeekParsed != null &&
      Number.isFinite(weeklyWeekParsed) &&
      weeklyWeekParsed >= 1
        ? weeklyWeekParsed
        : Math.max(1, displayWeek > 1 ? displayWeek - 1 : displayWeek);
    const weekIsComplete = syncedWeek < displayWeek;

    if (preview.openRosterSlots > 0) {
      notes.push(
        `${preview.openRosterSlots} roster slot(s) have no Sleeper user yet (pre-draft / invites pending).`
      );
    }
    if (preview.status === "pre_draft") {
      notes.push(
        "League status is pre_draft — standings and points will be 0 until the season starts."
      );
    }
    if (nflState) {
      notes.push(
        `NFL state: season ${nflState.season} · week ${nflState.display_week} · ${nflState.season_type}`
      );
    }
    notes.push(
      `Target week for matchups/badges: ${syncedWeek}${weekIsComplete ? " (complete)" : " (may still be in progress)"}`
    );

    const supabase = await createClient();

    let settingsUpdated = false;
    if (updateLeagueName && league.name) {
      const { error } = await supabase
        .from("league_settings")
        .update({
          name: league.name,
          season_year: seasonYear,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);
      if (error) {
        notes.push(`League settings update failed: ${error.message}`);
      } else {
        settingsUpdated = true;
        notes.push(`Updated site league name to “${league.name}”.`);
      }
    }

    const { data: existingOwners, error: ownersErr } = await supabase
      .from("owners")
      .select("id, display_name, team_name, sleeper_username");
    if (ownersErr) {
      return {
        ok: false,
        error: `Failed to load owners: ${ownersErr.message}`,
      };
    }

    let owners = (existingOwners ?? []) as {
      id: string;
      display_name: string;
      team_name: string | null;
      sleeper_username?: string | null;
    }[];
    let ownersUpdated = 0;
    let ownersCreated = 0;
    const unmatched: string[] = [];
    const teamPreview: SleeperSyncSummary["teamPreview"] = [];
    const rosterToOwner = new Map<number, string>();
    const standingsTeams: {
      ownerId: string;
      wins: number;
      losses: number;
      ties: number;
      pointsFor: number;
      pointsAgainst: number;
    }[] = [];

    for (const team of preview.teams) {
      if (team.openSlot) {
        teamPreview?.push({
          teamName: team.teamName,
          userDisplayName: null,
          record: `${team.wins}-${team.losses}-${team.ties}`,
          matchedOwner: undefined,
        });
        continue;
      }

      const names = [team.teamName, team.userDisplayName ?? ""].filter(
        Boolean
      ) as string[];
      let ownerId = matchOwnerId(names, owners);
      let matchedLabel: string | undefined;

      if (!ownerId && createMissing) {
        const display =
          team.userDisplayName || team.teamName || `Roster ${team.rosterId}`;
        const { data: created, error: createErr } = await supabase
          .from("owners")
          .insert({
            display_name: display,
            team_name: team.teamName,
            sleeper_username: team.userDisplayName,
            wins: updateRecords ? team.wins : 0,
            losses: updateRecords ? team.losses : 0,
            ties: updateRecords ? team.ties : 0,
            prize_money: 0,
            badges: [],
            is_admin: false,
            sort_order: owners.length + 1,
          })
          .select("id, display_name, team_name, sleeper_username")
          .single();

        if (createErr || !created) {
          unmatched.push(
            `${team.teamName} (create failed: ${createErr?.message})`
          );
          teamPreview?.push({
            teamName: team.teamName,
            userDisplayName: team.userDisplayName,
            record: `${team.wins}-${team.losses}-${team.ties}`,
          });
          continue;
        }
        owners = [...owners, created];
        ownerId = created.id;
        ownersCreated += 1;
        matchedLabel = `created → ${created.display_name}`;
      }

      if (!ownerId) {
        unmatched.push(
          `${team.teamName}${team.userDisplayName ? ` (@${team.userDisplayName})` : ""}`
        );
        teamPreview?.push({
          teamName: team.teamName,
          userDisplayName: team.userDisplayName,
          record: `${team.wins}-${team.losses}-${team.ties}`,
        });
        continue;
      }

      rosterToOwner.set(team.rosterId, ownerId);

      const siteOwner = owners.find((o) => o.id === ownerId);
      matchedLabel =
        matchedLabel || `matched → ${siteOwner?.display_name ?? ownerId}`;

      const patch: Record<string, unknown> = {
        team_name: team.teamName,
      };
      if (team.userDisplayName) {
        patch.sleeper_username = team.userDisplayName;
      }
      if (updateRecords) {
        patch.wins = team.wins;
        patch.losses = team.losses;
        patch.ties = team.ties;
      }

      const { error: updErr } = await supabase
        .from("owners")
        .update(patch)
        .eq("id", ownerId);

      if (updErr) {
        unmatched.push(`${team.teamName} (update failed: ${updErr.message})`);
      } else {
        ownersUpdated += 1;
      }

      if (updateRecords) {
        standingsTeams.push({
          ownerId,
          wins: team.wins,
          losses: team.losses,
          ties: team.ties,
          pointsFor: team.pointsFor,
          pointsAgainst: team.pointsAgainst,
        });
      }

      teamPreview?.push({
        teamName: team.teamName,
        userDisplayName: team.userDisplayName,
        record: `${team.wins}-${team.losses}-${team.ties}`,
        matchedOwner: matchedLabel,
      });
    }

    // Season-to-date standings with proper rank (W-L then PF)
    let standingsUpserted = 0;
    if (updateRecords && standingsTeams.length > 0) {
      const ranks = computeStandingsRanks(standingsTeams);
      for (const t of standingsTeams) {
        const rank = ranks.get(t.ownerId) ?? 0;
        const { data: existing } = await supabase
          .from("standings")
          .select("id")
          .eq("season", seasonYear)
          .eq("owner_id", t.ownerId)
          .is("week", null)
          .maybeSingle();

        if (existing?.id) {
          const { error } = await supabase
            .from("standings")
            .update({
              wins: t.wins,
              losses: t.losses,
              ties: t.ties,
              points_for: t.pointsFor,
              points_against: t.pointsAgainst,
              rank,
            })
            .eq("id", existing.id);
          if (!error) standingsUpserted += 1;
        } else {
          const { error } = await supabase.from("standings").insert({
            season: seasonYear,
            week: null,
            owner_id: t.ownerId,
            wins: t.wins,
            losses: t.losses,
            ties: t.ties,
            points_for: t.pointsFor,
            points_against: t.pointsAgainst,
            rank,
          });
          if (!error) standingsUpserted += 1;
        }
      }
      notes.push(`Standings updated for ${standingsUpserted} owner(s).`);
    }

    if (unmatched.length) {
      notes.push(
        `Unmatched / failed: ${unmatched.join("; ")}. Rename site owners to match, or enable “Create missing owners”.`
      );
    }

    // Season draft board (only if that year's picks are empty)
    let draftPicksWritten = 0;
    if (rosterToOwner.size > 0) {
      const usersById = new Map(users.map((u) => [u.user_id, u]));
      const teamNameByRoster = new Map(
        preview.teams.map((t) => [t.rosterId, t.teamName] as const)
      );
      const draftResult = await syncSleeperDraftPicks({
        supabase,
        leagueId,
        draftId: league.draft_id ?? null,
        seasonYear,
        rosterToOwner,
        usersById,
        teamNameByRoster,
        onlyIfEmpty: true,
      });
      draftPicksWritten = draftResult.picksWritten;
      notes.push(...draftResult.notes);
    } else {
      notes.push("Skipped draft import — no roster→owner mappings yet.");
    }

    // Weekly matchups from Sleeper (prefer over manual for this week)
    let matchupsWritten = 0;
    const seasonUnderway =
      preview.status !== "pre_draft" && preview.status !== "drafting";

    if (syncMatchups && seasonUnderway && rosterToOwner.size > 0) {
      const matchResult = await syncWeeklyMatchupsFromSleeper({
        supabase,
        leagueId,
        season: seasonYear,
        week: syncedWeek,
        rosterToOwner,
        rosterPositions: league.roster_positions ?? null,
        weekIsComplete,
      });
      matchupsWritten = matchResult.matchupsWritten;
      notes.push(...matchResult.notes);
    } else if (syncMatchups && !seasonUnderway) {
      notes.push("Skipped weekly matchups — league is still pre-draft/drafting.");
    }

    // Stamp last successful sync
    const lastSyncAt = new Date().toISOString();
    const { error: syncStampErr } = await supabase
      .from("league_settings")
      .update({
        last_sleeper_sync_at: lastSyncAt,
        season_year: seasonYear,
        updated_at: lastSyncAt,
      })
      .eq("id", 1);
    if (syncStampErr) {
      notes.push(
        `Could not save last_sleeper_sync_at (run migrate-sleeper-sync-meta.sql): ${syncStampErr.message}`
      );
    }

    let weeklyEmail: SleeperSyncSummary["weeklyEmail"];
    let badgeAwards: SleeperSyncSummary["badgeAwards"];

    if (emailWeeklyAfterSync) {
      if (!seasonUnderway) {
        notes.push(
          "Skipped weekly results email — league is still pre-draft/drafting."
        );
      } else {
        const emailResult = await sendWeeklyResultsEmailToOwners({
          leagueId,
          week: syncedWeek,
        });
        weeklyEmail = {
          sent: emailResult.sent,
          failed: emailResult.failed,
          message: emailResult.message,
          week: emailResult.week,
        };
        notes.push(
          `Weekly email (week ${emailResult.week ?? syncedWeek}): ${emailResult.message}`
        );
        if (emailResult.notes?.length) {
          notes.push(...emailResult.notes);
        }
      }
    }

    if (autoAwardBadges) {
      if (!seasonUnderway) {
        notes.push(
          "Skipped weekly badges — league is still pre-draft/drafting."
        );
      } else {
        const badgeResult = await evaluateWeeklyBadges({
          leagueId,
          week: syncedWeek,
          seasonYear,
        });
        badgeAwards = {
          week: badgeResult.week,
          summary: badgeResult.summary,
          awarded: badgeResult.inserted.map(
            (a) => `${a.badge_key}→${a.owner_name}`
          ),
          skipped: badgeResult.skipped,
        };
        notes.push(`Badges: ${badgeResult.summary}`);
        if (badgeResult.skipped.length) {
          notes.push(
            `Badge skips: ${badgeResult.skipped.slice(0, 4).join("; ")}`
          );
        }
        if (!badgeResult.ok && badgeResult.error) {
          notes.push(`Badge eval error: ${badgeResult.error}`);
        }
      }
    }

    // Headline summary for admin UI
    const draftBit =
      draftPicksWritten > 0
        ? `, ${draftPicksWritten} draft picks`
        : "";
    const headline = seasonUnderway
      ? `Week ${syncedWeek} synced — ${matchupsWritten} matchup${matchupsWritten === 1 ? "" : "s"}, standings updated${draftBit}${
          badgeAwards?.awarded?.length
            ? `, badges: ${badgeAwards.awarded
                .map((s) => s.replace("→", " → ").replace(/_/g, " "))
                .join(", ")}`
            : ""
        }`
      : `Sync complete — ${ownersUpdated} owners updated${draftBit}`;
    notes.unshift(headline);

    revalidateAll();

    return {
      ok: true,
      leagueId: preview.leagueId,
      leagueName: preview.leagueName,
      season: preview.season,
      status: preview.status,
      joinedUsers: preview.joinedUsers,
      openRosterSlots: preview.openRosterSlots,
      teamsFound: preview.teams.length,
      ownersUpdated,
      ownersCreated,
      ownersUnmatched: unmatched,
      standingsUpserted,
      settingsUpdated,
      matchupsWritten,
      draftPicksWritten,
      syncedWeek,
      lastSyncAt,
      teamPreview,
      notes,
      weeklyEmail,
      badgeAwards,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Sleeper sync failed",
      leagueId,
    };
  }
}

/**
 * Manual “Send weekly email” — Week X Results to all owners with email on file.
 * Does not require a full standings sync first (pulls live Sleeper matchups/standings).
 */
export async function sendWeeklyResultsEmail(
  formData: FormData
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const leagueId =
    String(formData.get("league_id") ?? "").trim() ||
    SLEEPER_DEFAULT_LEAGUE_ID;
  const weekRaw = String(formData.get("week") ?? "").trim();
  const week = weekRaw ? Number.parseInt(weekRaw, 10) : undefined;

  if (weekRaw && (!Number.isFinite(week) || (week ?? 0) < 1)) {
    return fail("Week must be a positive number");
  }

  const result = await sendWeeklyResultsEmailToOwners({
    leagueId,
    week: week != null && Number.isFinite(week) ? week : undefined,
  });

  if (!result.ok && result.sent === 0) {
    return fail(
      result.message +
        (result.errors[0] ? ` — ${result.errors[0]}` : "")
    );
  }

  const weekLabel =
    result.week != null ? `Week ${result.week}` : "Weekly";
  const note =
    result.notes && result.notes.length
      ? ` ${result.notes.slice(0, 2).join(" ")}`
      : "";

  return ok(
    `${weekLabel} results email: ${result.message}${note}`.trim()
  );
}

/**
 * Re-run weekly badge evaluation for a given week (or last completed week).
 */
export async function evaluateWeeklyBadgesAction(
  formData: FormData
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const leagueId =
    String(formData.get("league_id") ?? "").trim() ||
    SLEEPER_DEFAULT_LEAGUE_ID;
  const weekRaw = String(formData.get("week") ?? "").trim();
  const week = weekRaw ? Number.parseInt(weekRaw, 10) : undefined;

  if (weekRaw && (!Number.isFinite(week) || (week ?? 0) < 1)) {
    return fail("Week must be a positive number");
  }

  const result = await evaluateWeeklyBadges({
    leagueId,
    week: week != null && Number.isFinite(week) ? week : undefined,
  });

  if (!result.ok) {
    return fail(result.error ?? "Badge evaluation failed");
  }

  revalidateAll();

  const awarded =
    result.inserted.length > 0
      ? result.inserted
          .map((a) => `${a.badge_key.replace(/_/g, " ")} → ${a.owner_name}`)
          .join("; ")
      : "no new awards (already awarded or no qualifiers)";

  const skipNote =
    result.skipped.length > 0
      ? ` Skipped: ${result.skipped.slice(0, 3).join("; ")}`
      : "";

  return ok(
    `Week ${result.week} badges: ${awarded}.${skipNote}`.trim()
  );
}
