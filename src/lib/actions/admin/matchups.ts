"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "./types";
import { fail, ok } from "./types";
import { requireAdmin } from "./utils";
import { parseIntField, parseNumberField } from "./parse";

function revalidateMatchups() {
  revalidatePath("/matchups");
  revalidatePath("/admin/matchups");
  revalidatePath("/dashboard");
}

export async function createMatchup(formData: FormData): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const season = parseIntField(formData.get("season"), "Season", {
    min: 2000,
    max: 2100,
  });
  if (season.error) return fail(season.error);

  const week = parseIntField(formData.get("week"), "Week", {
    min: 1,
    max: 20,
  });
  if (week.error) return fail(week.error);

  const home_owner_id = String(formData.get("home_owner_id") ?? "").trim();
  const away_owner_id = String(formData.get("away_owner_id") ?? "").trim();
  if (!home_owner_id || !away_owner_id) {
    return fail("Both home and away owners are required");
  }
  if (home_owner_id === away_owner_id) {
    return fail("Home and away must be different owners");
  }

  const is_playoff = formData.get("is_playoff") === "on";

  const supabase = await createClient();
  const { error } = await supabase.from("matchups").insert({
    season: season.value,
    week: week.value,
    home_owner_id,
    away_owner_id,
    is_playoff,
    is_complete: false,
  });

  if (error) return fail(error.message);
  revalidateMatchups();
  return ok("Matchup created");
}

export async function updateMatchup(formData: FormData): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return fail("Matchup id is required");

  const homeRaw = String(formData.get("home_score") ?? "").trim();
  const awayRaw = String(formData.get("away_score") ?? "").trim();

  let home_score: number | null = null;
  let away_score: number | null = null;

  if (homeRaw !== "") {
    const h = parseNumberField(homeRaw, "Home score", { min: 0 });
    if (h.error) return fail(h.error);
    home_score = h.value;
  }
  if (awayRaw !== "") {
    const a = parseNumberField(awayRaw, "Away score", { min: 0 });
    if (a.error) return fail(a.error);
    away_score = a.value;
  }

  const is_complete = formData.get("is_complete") === "on";
  const is_playoff = formData.get("is_playoff") === "on";

  const supabase = await createClient();
  const { error } = await supabase
    .from("matchups")
    .update({
      home_score,
      away_score,
      is_complete,
      is_playoff,
    })
    .eq("id", id);

  if (error) return fail(error.message);
  revalidateMatchups();
  return ok("Matchup updated");
}

export async function deleteMatchup(formData: FormData): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return fail("Matchup id is required");

  const supabase = await createClient();
  const { error } = await supabase.from("matchups").delete().eq("id", id);
  if (error) return fail(error.message);
  revalidateMatchups();
  return ok("Matchup deleted");
}

export async function upsertStanding(formData: FormData): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const season = parseIntField(formData.get("season"), "Season", {
    min: 2000,
    max: 2100,
  });
  if (season.error) return fail(season.error);

  const owner_id = String(formData.get("owner_id") ?? "").trim();
  if (!owner_id) return fail("Owner is required");

  const wins = parseIntField(formData.get("wins"), "Wins", { min: 0 });
  if (wins.error) return fail(wins.error);
  const losses = parseIntField(formData.get("losses"), "Losses", { min: 0 });
  if (losses.error) return fail(losses.error);
  const ties = parseIntField(formData.get("ties"), "Ties", {
    min: 0,
    allowEmpty: true,
  });
  if (ties.error) return fail(ties.error);
  const pf = parseNumberField(formData.get("points_for"), "Points for", {
    min: 0,
  });
  if (pf.error) return fail(pf.error);
  const pa = parseNumberField(
    formData.get("points_against"),
    "Points against",
    { min: 0 }
  );
  if (pa.error) return fail(pa.error);
  const rank = parseIntField(formData.get("rank"), "Rank", {
    min: 1,
    max: 20,
  });
  if (rank.error) return fail(rank.error);

  const supabase = await createClient();

  // Season-to-date standings use week = null
  const { data: existing } = await supabase
    .from("standings")
    .select("id")
    .eq("season", season.value!)
    .eq("owner_id", owner_id)
    .is("week", null)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase
      .from("standings")
      .update({
        wins: wins.value,
        losses: losses.value,
        ties: ties.value ?? 0,
        points_for: pf.value,
        points_against: pa.value,
        rank: rank.value,
      })
      .eq("id", existing.id);
    if (error) return fail(error.message);
  } else {
    const { error } = await supabase.from("standings").insert({
      season: season.value,
      week: null,
      owner_id,
      wins: wins.value,
      losses: losses.value,
      ties: ties.value ?? 0,
      points_for: pf.value,
      points_against: pa.value,
      rank: rank.value,
    });
    if (error) return fail(error.message);
  }

  revalidateMatchups();
  return ok("Standing saved");
}
