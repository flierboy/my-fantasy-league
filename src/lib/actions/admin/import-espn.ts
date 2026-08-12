"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  ESPN_DEFAULT_LEAGUE_ID,
  ESPN_DEFAULT_SEASON,
  fetchEspnLeague,
} from "@/lib/espn/client";
import { buildImportPlan, matchOwnerId } from "@/lib/espn/import";
import { requireAdmin } from "./utils";

export type EspnImportSummary = {
  ok: boolean;
  error?: string;
  season?: number;
  leagueId?: string;
  espnLeagueName?: string | null;
  usedCookies?: boolean;
  teamsFound?: number;
  ownersUpdated?: number;
  ownersUnmatched?: string[];
  ownersCreated?: number;
  standingsUpserted?: number;
  matchupsInserted?: number;
  historyCreated?: string[];
  champion?: string | null;
  runnerUp?: string | null;
  notes?: string[];
};

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/history");
  revalidatePath("/dashboard");
  revalidatePath("/matchups");
  revalidatePath("/admin");
  revalidatePath("/admin/import-espn");
  revalidatePath("/admin/owners");
  revalidatePath("/admin/history");
  revalidatePath("/admin/matchups");
}

/**
 * One-time ESPN Fantasy import for historical league data.
 * Admin only. Not a live sync.
 */
export async function importEspnLeague(
  formData: FormData
): Promise<EspnImportSummary> {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false, error: gate.error };

  const leagueId =
    String(formData.get("league_id") ?? "").trim() || ESPN_DEFAULT_LEAGUE_ID;
  const seasonRaw = String(formData.get("season") ?? ESPN_DEFAULT_SEASON).trim();
  const season = Number(seasonRaw) || ESPN_DEFAULT_SEASON;
  const swid = String(formData.get("swid") ?? "").trim() || undefined;
  const espnS2 = String(formData.get("espn_s2") ?? "").trim() || undefined;
  const usedCookies = Boolean(swid || espnS2);
  const createMissing = formData.get("create_missing") === "on";
  const importMatchups = formData.get("import_matchups") === "on";

  const notes: string[] = [];

  if (season === 2025 && (!swid || !espnS2)) {
    notes.push(
      "Season 2025 usually requires both espn_s2 and SWID. Import will still try, but expect 401 without cookies."
    );
  }
  if ((swid && !espnS2) || (!swid && espnS2)) {
    return {
      ok: false,
      error:
        "Provide both espn_s2 and SWID cookies together (not just one).",
      season,
      leagueId,
      usedCookies,
    };
  }

  try {
    const payload = await fetchEspnLeague({
      leagueId,
      season,
      swid,
      espnS2,
    });
    if (usedCookies) {
      notes.push("Authenticated with SWID + espn_s2 cookies.");
    }

    const plan = buildImportPlan(payload, season);
    const supabase = await createClient();

    const { data: existingOwners, error: ownersErr } = await supabase
      .from("owners")
      .select("id, display_name, team_name");
    if (ownersErr) {
      return { ok: false, error: `Failed to load owners: ${ownersErr.message}` };
    }

    let owners = existingOwners ?? [];
    let ownersUpdated = 0;
    let ownersCreated = 0;
    const unmatched: string[] = [];
    /** espnTeamId → site owner uuid */
    const espnToOwner = new Map<number, string>();

    for (const team of plan.teams) {
      let ownerId = matchOwnerId(team.teamName, owners);

      // Also try matching primary ESPN member display name
      if (!ownerId) {
        for (const n of team.ownerDisplayNames) {
          ownerId = matchOwnerId(n, owners);
          if (ownerId) break;
        }
      }

      if (!ownerId && createMissing) {
        const { data: created, error: createErr } = await supabase
          .from("owners")
          .insert({
            display_name: team.teamName,
            team_name: team.teamName,
            wins: team.wins,
            losses: team.losses,
            ties: team.ties,
            prize_money: 0,
            badges: [],
            is_admin: false,
            sort_order: owners.length + 1,
          })
          .select("id, display_name, team_name")
          .single();
        if (createErr || !created) {
          unmatched.push(`${team.teamName} (create failed: ${createErr?.message})`);
          continue;
        }
        owners = [...owners, created];
        ownerId = created.id;
        ownersCreated += 1;
      }

      if (!ownerId) {
        unmatched.push(team.teamName);
        continue;
      }

      espnToOwner.set(team.espnTeamId, ownerId);

      // Franchise all-time W-L: set from this season import (historical snapshot)
      const { error: updErr } = await supabase
        .from("owners")
        .update({
          wins: team.wins,
          losses: team.losses,
          ties: team.ties,
          // Keep display_name; refresh team_name if blank-ish
          team_name: team.teamName,
        })
        .eq("id", ownerId);

      if (updErr) {
        unmatched.push(`${team.teamName} (update failed: ${updErr.message})`);
      } else {
        ownersUpdated += 1;
      }
    }

    // Season standings snapshot
    let standingsUpserted = 0;
    for (const team of plan.teams) {
      const ownerId = espnToOwner.get(team.espnTeamId);
      if (!ownerId) continue;
      const rank = team.rankFinal ?? team.playoffSeed ?? 0;

      const { data: existing } = await supabase
        .from("standings")
        .select("id")
        .eq("season", season)
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
            rank,
          })
          .eq("id", existing.id);
        if (!error) standingsUpserted += 1;
      } else {
        const { error } = await supabase.from("standings").insert({
          season,
          week: null,
          owner_id: ownerId,
          wins: team.wins,
          losses: team.losses,
          ties: team.ties,
          points_for: team.pointsFor,
          points_against: team.pointsAgainst,
          rank,
        });
        if (!error) standingsUpserted += 1;
      }
    }

    // Matchups (completed only, optional)
    let matchupsInserted = 0;
    if (importMatchups) {
      // Clear prior import for this season to avoid duplicates
      await supabase.from("matchups").delete().eq("season", season);

      const rows = [];
      for (const m of plan.matchups) {
        const home = espnToOwner.get(m.homeEspnId);
        const away = espnToOwner.get(m.awayEspnId);
        if (!home || !away) continue;
        if (!m.isComplete) continue;
        rows.push({
          season,
          week: m.week,
          home_owner_id: home,
          away_owner_id: away,
          home_score: m.homeScore,
          away_score: m.awayScore,
          is_playoff: m.isPlayoff,
          is_complete: true,
        });
      }
      if (rows.length) {
        // Insert in chunks
        for (let i = 0; i < rows.length; i += 40) {
          const chunk = rows.slice(i, i + 40);
          const { error, count } = await supabase
            .from("matchups")
            .insert(chunk)
            .select("id");
          if (!error && count == null) {
            matchupsInserted += chunk.length;
          } else if (!error) {
            matchupsInserted += chunk.length;
          } else {
            notes.push(`Matchup insert issue: ${error.message}`);
          }
        }
      }
    } else {
      notes.push("Matchups skipped (checkbox off).");
    }

    // History: champion + season recap note
    const historyCreated: string[] = [];
    if (plan.championTeamName) {
      // Avoid duplicate champion entry for same season
      const { data: existingChamp } = await supabase
        .from("history_entries")
        .select("id")
        .eq("entry_type", "champion")
        .eq("season_year", season)
        .maybeSingle();

      if (existingChamp?.id) {
        const { error } = await supabase
          .from("history_entries")
          .update({
            year_label: String(season),
            title: `${season} Champion`,
            champion: plan.championTeamName,
            runner_up: plan.runnerUpTeamName,
            notes: `Imported from ESPN league ${leagueId}`,
            sort_order: 0,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingChamp.id);
        if (!error) historyCreated.push(`Updated champion: ${plan.championTeamName}`);
      } else {
        const { error } = await supabase.from("history_entries").insert({
          entry_type: "champion",
          year_label: String(season),
          season_year: season,
          title: `${season} Champion`,
          champion: plan.championTeamName,
          runner_up: plan.runnerUpTeamName,
          notes: `Imported from ESPN league ${leagueId}`,
          sort_order: 0,
        });
        if (error) {
          if (error.message.includes("history_entries") || error.code === "42P01") {
            notes.push(
              "history_entries table missing — run migrate-history-entries.sql to store champions"
            );
          } else {
            notes.push(`History insert failed: ${error.message}`);
          }
        } else {
          historyCreated.push(`Champion: ${plan.championTeamName}`);
        }
      }
    } else {
      notes.push(
        "No champion detected (season may be incomplete / all ranks 0)."
      );
    }

    // Top scorer record
    const topPf = [...plan.teams].sort((a, b) => b.pointsFor - a.pointsFor)[0];
    if (topPf && topPf.pointsFor > 0) {
      const { error } = await supabase.from("history_entries").insert({
        entry_type: "record",
        year_label: String(season),
        season_year: season,
        title: `${season} Points leader`,
        champion: topPf.teamName,
        notes: `${topPf.pointsFor.toFixed(1)} PF · ESPN import`,
        sort_order: 10,
      });
      if (!error) {
        historyCreated.push(`Points leader: ${topPf.teamName}`);
      }
    }

    // Season note with standings snapshot
    const standingsLines = plan.teams
      .map(
        (t, i) =>
          `${t.rankFinal ?? i + 1}. ${t.teamName} ${t.wins}-${t.losses}-${t.ties} (${t.pointsFor.toFixed(1)} PF)`
      )
      .join("\n");
    if (standingsLines) {
      const { error } = await supabase.from("history_entries").insert({
        entry_type: "note",
        year_label: String(season),
        season_year: season,
        title: `${season} ESPN standings import`,
        notes: standingsLines,
        sort_order: 20,
      });
      if (!error) historyCreated.push("Standings note");
    }

    if (unmatched.length) {
      notes.push(
        `Unmatched ESPN teams (no site owner): ${unmatched.join(", ")}. Enable “Create missing owners” or rename site teams to match.`
      );
    }

    const allZero = plan.teams.every(
      (t) => t.wins === 0 && t.losses === 0 && t.pointsFor === 0
    );
    if (allZero) {
      notes.push(
        "All records are 0-0 with 0 PF — season likely preseason or not started. 2025 historical data may require ESPN cookies if the API returns 401."
      );
    }

    revalidateAll();

    return {
      ok: true,
      season,
      leagueId,
      espnLeagueName: plan.leagueName,
      usedCookies,
      teamsFound: plan.teams.length,
      ownersUpdated,
      ownersUnmatched: unmatched,
      ownersCreated,
      standingsUpserted,
      matchupsInserted,
      historyCreated,
      champion: plan.championTeamName,
      runnerUp: plan.runnerUpTeamName,
      notes,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Import failed",
      season,
      leagueId,
      usedCookies,
      notes,
    };
  }
}
