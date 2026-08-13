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
import { sendWeeklyResultsEmailToOwners } from "@/lib/email/weekly";
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
};

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/matchups");
  revalidatePath("/history");
  revalidatePath("/admin");
  revalidatePath("/admin/sleeper");
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
      .select("id, display_name, team_name");
    if (ownersErr) {
      return {
        ok: false,
        error: `Failed to load owners: ${ownersErr.message}`,
      };
    }

    let owners = existingOwners ?? [];
    let ownersUpdated = 0;
    let ownersCreated = 0;
    const unmatched: string[] = [];
    const teamPreview: SleeperSyncSummary["teamPreview"] = [];

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
            wins: updateRecords ? team.wins : 0,
            losses: updateRecords ? team.losses : 0,
            ties: updateRecords ? team.ties : 0,
            prize_money: 0,
            badges: [],
            is_admin: false,
            sort_order: owners.length + 1,
          })
          .select("id, display_name, team_name")
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

      const siteOwner = owners.find((o) => o.id === ownerId);
      matchedLabel =
        matchedLabel || `matched → ${siteOwner?.display_name ?? ownerId}`;

      const patch: Record<string, unknown> = {
        team_name: team.teamName,
      };
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

      // Season standings snapshot
      let standingsOk = false;
      if (updateRecords) {
        const { data: existing } = await supabase
          .from("standings")
          .select("id")
          .eq("season", seasonYear)
          .eq("owner_id", ownerId)
          .is("week", null)
          .maybeSingle();

        if (existing?.id) {
          const { error } = await supabase
            .from("standings")
            .update({
              wins: team.wins,
              losses: team.losses,
              ties: team.ties,
              points_for: team.pointsFor,
              points_against: team.pointsAgainst,
              rank: team.waiverPosition ?? 0,
            })
            .eq("id", existing.id);
          standingsOk = !error;
        } else {
          const { error } = await supabase.from("standings").insert({
            season: seasonYear,
            week: null,
            owner_id: ownerId,
            wins: team.wins,
            losses: team.losses,
            ties: team.ties,
            points_for: team.pointsFor,
            points_against: team.pointsAgainst,
            rank: team.waiverPosition ?? 0,
          });
          standingsOk = !error;
        }
      }

      teamPreview?.push({
        teamName: team.teamName,
        userDisplayName: team.userDisplayName,
        record: `${team.wins}-${team.losses}-${team.ties}`,
        matchedOwner: matchedLabel + (standingsOk ? " · standings ok" : ""),
      });
    }

    // Count standings from preview length of successful matches roughly
    const standingsUpserted = teamPreview.filter((t) =>
      t.matchedOwner?.includes("standings ok")
    ).length;

    if (unmatched.length) {
      notes.push(
        `Unmatched / failed: ${unmatched.join("; ")}. Rename site owners to match, or enable “Create missing owners”.`
      );
    }

    revalidateAll();

    let weeklyEmail: SleeperSyncSummary["weeklyEmail"];

    // Auto weekly email only when season is underway (not pre_draft) and opted in
    const seasonUnderway =
      preview.status !== "pre_draft" && preview.status !== "drafting";
    if (emailWeeklyAfterSync) {
      if (!seasonUnderway) {
        notes.push(
          "Skipped weekly results email — league is still pre-draft/drafting. Use “Send weekly email” once the season starts."
        );
      } else {
        const emailResult = await sendWeeklyResultsEmailToOwners({
          leagueId,
          week:
            weeklyWeekParsed != null && Number.isFinite(weeklyWeekParsed)
              ? weeklyWeekParsed
              : undefined,
        });
        weeklyEmail = {
          sent: emailResult.sent,
          failed: emailResult.failed,
          message: emailResult.message,
          week: emailResult.week,
        };
        notes.push(
          `Weekly email (week ${emailResult.week ?? "?"}): ${emailResult.message}`
        );
        if (emailResult.notes?.length) {
          notes.push(...emailResult.notes);
        }
      }
    }

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
      teamPreview,
      notes,
      weeklyEmail,
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
