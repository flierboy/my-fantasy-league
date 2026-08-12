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
  const draft_at_raw = String(formData.get("draft_at") ?? "").trim();

  if (!name) return fail("League name is required");
  if (!tagline) return fail("Tagline is required");
  if (!rules_summary) return fail("Rules summary is required");
  if (!trophy_blurb) return fail("Trophy text is required");

  let draft_at: string | null = null;
  if (draft_at_raw) {
    // datetime-local is local without TZ; treat as America/New_York intent via ISO if Z present
    const d = new Date(draft_at_raw);
    if (Number.isNaN(d.getTime())) {
      return fail("Draft date/time is invalid");
    }
    draft_at = d.toISOString();
  }

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
      draft_at,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) {
    // Column may not exist yet
    if (error.message.includes("draft_at")) {
      return fail(
        "draft_at column missing — run supabase/migrate-upper-deckers-features.sql first"
      );
    }
    return fail(error.message);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  revalidatePath("/dashboard");
  revalidatePath("/dues");
  revalidatePath("/admin/dues");
  return ok("League settings saved");
}
