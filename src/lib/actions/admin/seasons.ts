"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "./types";
import { fail, ok } from "./types";
import { requireAdmin } from "./utils";
import { parseIntField } from "./parse";

function revalidateSeasons() {
  revalidatePath("/history");
  revalidatePath("/players");
  revalidatePath("/admin");
  revalidatePath("/admin/seasons");
  revalidatePath("/punishments");
  revalidatePath("/dashboard");
}

function formatDbError(error: { message: string; code?: string }): string {
  if (
    error.code === "42P01" ||
    /does not exist/i.test(error.message)
  ) {
    return `${error.message} — run supabase/migrate-seasons-punishments.sql`;
  }
  return error.message;
}

/** Create an empty past season shell (standings filled next). */
export async function createPastSeason(
  formData: FormData
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const year = parseIntField(formData.get("season_year"), "Season year", {
    min: 1990,
    max: 2100,
  });
  if (year.error || year.value == null) {
    return fail(year.error ?? "Season year required");
  }

  const label =
    String(formData.get("label") ?? "").trim() || String(year.value);
  const recap_notes =
    String(formData.get("recap_notes") ?? "").trim() || null;
  const champion_owner_id =
    String(formData.get("champion_owner_id") ?? "").trim() || null;
  const runner_up_owner_id =
    String(formData.get("runner_up_owner_id") ?? "").trim() || null;
  const sort = parseIntField(formData.get("sort_order"), "Sort order", {
    min: 0,
    allowEmpty: true,
  });
  if (sort.error) return fail(sort.error);

  const supabase = await createClient();
  const { data: season, error } = await supabase
    .from("past_seasons")
    .insert({
      season_year: year.value,
      label,
      recap_notes,
      champion_owner_id,
      runner_up_owner_id,
      sort_order: sort.value ?? 0,
    })
    .select("id")
    .single();

  if (error) return fail(formatDbError(error));

  // Seed standings rows for every current owner (admin fills W-L later)
  const { data: owners } = await supabase
    .from("owners")
    .select("id, team_name, display_name, sort_order")
    .order("sort_order", { ascending: true });

  if (owners && owners.length > 0 && season?.id) {
    const rows = owners.map((o, i) => ({
      season_id: season.id as string,
      owner_id: o.id as string,
      team_name: (o.team_name as string | null) || (o.display_name as string),
      wins: 0,
      losses: 0,
      ties: 0,
      points_for: 0,
      points_against: 0,
      rank: i + 1,
      is_champion: o.id === champion_owner_id,
      is_runner_up: o.id === runner_up_owner_id,
    }));
    const { error: stErr } = await supabase
      .from("past_season_standings")
      .insert(rows);
    if (stErr) {
      revalidateSeasons();
      return ok(
        `Season ${year.value} created, but standings seed failed: ${stErr.message}`
      );
    }
  }

  revalidateSeasons();
  return ok(`Season ${year.value} created`);
}

export async function updatePastSeason(
  formData: FormData
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return fail("Season id required");

  const year = parseIntField(formData.get("season_year"), "Season year", {
    min: 1990,
    max: 2100,
  });
  if (year.error || year.value == null) {
    return fail(year.error ?? "Season year required");
  }

  const label =
    String(formData.get("label") ?? "").trim() || String(year.value);
  const recap_notes =
    String(formData.get("recap_notes") ?? "").trim() || null;
  const champion_owner_id =
    String(formData.get("champion_owner_id") ?? "").trim() || null;
  const runner_up_owner_id =
    String(formData.get("runner_up_owner_id") ?? "").trim() || null;
  const sort = parseIntField(formData.get("sort_order"), "Sort order", {
    min: 0,
    allowEmpty: true,
  });
  if (sort.error) return fail(sort.error);

  const supabase = await createClient();
  const { error } = await supabase
    .from("past_seasons")
    .update({
      season_year: year.value,
      label,
      recap_notes,
      champion_owner_id,
      runner_up_owner_id,
      sort_order: sort.value ?? 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return fail(formatDbError(error));

  // Sync champion flags on standings
  await supabase
    .from("past_season_standings")
    .update({ is_champion: false, is_runner_up: false })
    .eq("season_id", id);

  if (champion_owner_id) {
    await supabase
      .from("past_season_standings")
      .update({ is_champion: true })
      .eq("season_id", id)
      .eq("owner_id", champion_owner_id);
  }
  if (runner_up_owner_id) {
    await supabase
      .from("past_season_standings")
      .update({ is_runner_up: true })
      .eq("season_id", id)
      .eq("owner_id", runner_up_owner_id);
  }

  revalidateSeasons();
  return ok("Season updated");
}

export async function deletePastSeason(
  formData: FormData
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return fail("Season id required");

  const supabase = await createClient();
  const { error } = await supabase.from("past_seasons").delete().eq("id", id);
  if (error) return fail(formatDbError(error));

  revalidateSeasons();
  return ok("Season deleted");
}

/**
 * Save full standings table for one season.
 * Expects FormData: season_id + payload JSON array of standing rows.
 */
export async function saveSeasonStandings(
  formData: FormData
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const season_id = String(formData.get("season_id") ?? "").trim();
  if (!season_id) return fail("Season id required");

  let rows: {
    id?: string;
    owner_id: string | null;
    team_name: string;
    wins: number | string;
    losses: number | string;
    ties: number | string;
    points_for: number | string;
    points_against: number | string;
    rank: number | string;
    is_champion?: boolean;
    is_runner_up?: boolean;
  }[];

  try {
    rows = JSON.parse(String(formData.get("payload") ?? "[]"));
  } catch {
    return fail("Invalid standings payload");
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return fail("Add at least one standings row");
  }

  const supabase = await createClient();
  let champOwner: string | null = null;
  let ruOwner: string | null = null;

  for (const row of rows) {
    const id = String(row.id ?? "").trim();
    const owner_id = String(row.owner_id ?? "").trim() || null;
    const team_name = String(row.team_name ?? "").trim() || null;
    const wins = Number(row.wins);
    const losses = Number(row.losses);
    const ties = Number(row.ties ?? 0);
    const points_for = Number(row.points_for ?? 0);
    const points_against = Number(row.points_against ?? 0);
    const rank = Number(row.rank);
    const is_champion = Boolean(row.is_champion);
    const is_runner_up = Boolean(row.is_runner_up);

    if (!Number.isFinite(wins) || wins < 0) {
      return fail("Invalid wins value");
    }
    if (!Number.isFinite(losses) || losses < 0) {
      return fail("Invalid losses value");
    }
    if (!Number.isFinite(rank) || rank < 0) {
      return fail("Invalid rank");
    }

    if (is_champion && owner_id) champOwner = owner_id;
    if (is_runner_up && owner_id) ruOwner = owner_id;

    const payload = {
      season_id,
      owner_id,
      team_name,
      wins,
      losses,
      ties: Number.isFinite(ties) ? ties : 0,
      points_for: Number.isFinite(points_for) ? points_for : 0,
      points_against: Number.isFinite(points_against) ? points_against : 0,
      rank,
      is_champion,
      is_runner_up,
      updated_at: new Date().toISOString(),
    };

    if (id) {
      const { error } = await supabase
        .from("past_season_standings")
        .update(payload)
        .eq("id", id);
      if (error) return fail(formatDbError(error));
    } else {
      const { error } = await supabase
        .from("past_season_standings")
        .insert(payload);
      if (error) return fail(formatDbError(error));
    }
  }

  // Keep season header champ/runner in sync when flags set on rows
  if (champOwner || ruOwner) {
    const patch: Record<string, string | null> = {
      updated_at: new Date().toISOString(),
    };
    if (champOwner) patch.champion_owner_id = champOwner;
    if (ruOwner) patch.runner_up_owner_id = ruOwner;
    await supabase.from("past_seasons").update(patch).eq("id", season_id);
  }

  revalidateSeasons();
  return ok(`Saved ${rows.length} standings row(s)`);
}
