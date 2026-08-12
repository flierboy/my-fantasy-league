"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "./types";
import { fail, ok } from "./types";
import { requireAdmin } from "./utils";
import { parseIntField, parseNumberField } from "./parse";

export async function updateLeagueSettings(
  formData: FormData
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const name = String(formData.get("name") ?? "").trim();
  const tagline = String(formData.get("tagline") ?? "").trim();
  const rules_summary = String(formData.get("rules_summary") ?? "").trim();
  const trophy_blurb = String(formData.get("trophy_blurb") ?? "").trim();

  if (!name) return fail("League name is required");
  if (!tagline) return fail("Tagline is required");
  if (!rules_summary) return fail("Rules summary is required");
  if (!trophy_blurb) return fail("Trophy text is required");

  const dues = parseNumberField(formData.get("dues_amount"), "Dues amount", {
    min: 0,
  });
  if (dues.error) return fail(dues.error);

  const keepers = parseIntField(formData.get("keeper_count"), "Keepers", {
    min: 0,
  });
  if (keepers.error) return fail(keepers.error);

  const maxSeasons = parseIntField(
    formData.get("keeper_max_seasons"),
    "Max seasons",
    { min: 1 }
  );
  if (maxSeasons.error) return fail(maxSeasons.error);

  const season = parseIntField(formData.get("season_year"), "Season year", {
    min: 2000,
    max: 2100,
  });
  if (season.error) return fail(season.error);

  const supabase = await createClient();
  const { error } = await supabase
    .from("league_settings")
    .update({
      name,
      tagline,
      rules_summary,
      trophy_blurb,
      dues_amount: dues.value,
      keeper_count: keepers.value,
      keeper_max_seasons: maxSeasons.value,
      season_year: season.value,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) return fail(error.message);

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  revalidatePath("/dashboard");
  revalidatePath("/dues");
  revalidatePath("/admin/dues");
  return ok("League settings saved");
}
