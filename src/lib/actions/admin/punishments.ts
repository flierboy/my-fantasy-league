"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "./types";
import { fail, ok } from "./types";
import { requireAdmin } from "./utils";
import { parseIntField } from "./parse";

function revalidatePunishments() {
  revalidatePath("/punishments");
  revalidatePath("/history");
  revalidatePath("/players");
  revalidatePath("/admin");
  revalidatePath("/admin/punishments");
  revalidatePath("/dashboard");
}

function formatDbError(error: { message: string; code?: string }): string {
  if (error.code === "42P01" || /does not exist/i.test(error.message)) {
    return `${error.message} — run supabase/migrate-seasons-punishments.sql`;
  }
  return error.message;
}

export async function createPunishment(
  formData: FormData
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const year = parseIntField(formData.get("season_year"), "Year", {
    min: 1990,
    max: 2100,
  });
  if (year.error || year.value == null) {
    return fail(year.error ?? "Year required");
  }

  const owner_id = String(formData.get("owner_id") ?? "").trim() || null;
  const owner_label =
    String(formData.get("owner_label") ?? "").trim() || null;
  const title =
    String(formData.get("title") ?? "").trim() || "Punishment";
  const description = String(formData.get("description") ?? "").trim();
  if (!description) return fail("Description is required");

  const photo_url =
    String(formData.get("photo_url") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const sort = parseIntField(formData.get("sort_order"), "Sort order", {
    min: 0,
    allowEmpty: true,
  });
  if (sort.error) return fail(sort.error);

  if (!owner_id && !owner_label) {
    return fail("Pick an owner or enter a name label");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("punishments").insert({
    season_year: year.value,
    owner_id,
    owner_label,
    title,
    description,
    photo_url,
    notes,
    sort_order: sort.value ?? 0,
  });

  if (error) return fail(formatDbError(error));
  revalidatePunishments();
  return ok("Punishment recorded");
}

export async function updatePunishment(
  formData: FormData
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return fail("Id required");

  const year = parseIntField(formData.get("season_year"), "Year", {
    min: 1990,
    max: 2100,
  });
  if (year.error || year.value == null) {
    return fail(year.error ?? "Year required");
  }

  const owner_id = String(formData.get("owner_id") ?? "").trim() || null;
  const owner_label =
    String(formData.get("owner_label") ?? "").trim() || null;
  const title =
    String(formData.get("title") ?? "").trim() || "Punishment";
  const description = String(formData.get("description") ?? "").trim();
  if (!description) return fail("Description is required");

  const photo_url =
    String(formData.get("photo_url") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const sort = parseIntField(formData.get("sort_order"), "Sort order", {
    min: 0,
    allowEmpty: true,
  });
  if (sort.error) return fail(sort.error);

  const supabase = await createClient();
  const { error } = await supabase
    .from("punishments")
    .update({
      season_year: year.value,
      owner_id,
      owner_label,
      title,
      description,
      photo_url,
      notes,
      sort_order: sort.value ?? 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return fail(formatDbError(error));
  revalidatePunishments();
  return ok("Punishment updated");
}

export async function deletePunishment(
  formData: FormData
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return fail("Id required");

  const supabase = await createClient();
  const { error } = await supabase.from("punishments").delete().eq("id", id);
  if (error) return fail(formatDbError(error));

  revalidatePunishments();
  return ok("Punishment deleted");
}
