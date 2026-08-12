"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { BADGE_KEYS } from "@/lib/data/mappers";
import type { BadgeKey } from "@/lib/types";
import type { ActionResult } from "./types";
import { fail, ok } from "./types";
import { requireAdmin } from "./utils";
import { parseIntField, parseNumberField } from "./parse";

function revalidateOwners() {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/owners");
  revalidatePath("/dashboard");
  revalidatePath("/matchups");
  revalidatePath("/dues");
  revalidatePath("/admin/matchups");
  revalidatePath("/admin/dues");
}

function parseBadges(formData: FormData): BadgeKey[] {
  const raw = formData.getAll("badges").map(String);
  return raw.filter((b): b is BadgeKey => BADGE_KEYS.has(b as BadgeKey));
}

export async function createOwner(formData: FormData): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const display_name = String(formData.get("display_name") ?? "").trim();
  if (!display_name) return fail("Display name is required");

  const team_name = String(formData.get("team_name") ?? "").trim() || null;
  const wins = parseIntField(formData.get("wins"), "Wins", { min: 0 });
  if (wins.error) return fail(wins.error);
  const losses = parseIntField(formData.get("losses"), "Losses", { min: 0 });
  if (losses.error) return fail(losses.error);
  const ties = parseIntField(formData.get("ties"), "Ties", {
    min: 0,
    allowEmpty: true,
  });
  if (ties.error) return fail(ties.error);
  const prize = parseNumberField(formData.get("prize_money"), "Prize money", {
    min: 0,
  });
  if (prize.error) return fail(prize.error);
  const draft = parseIntField(formData.get("draft_slot"), "Draft slot", {
    min: 1,
    max: 20,
    allowEmpty: true,
  });
  if (draft.error) return fail(draft.error);
  const sort = parseIntField(formData.get("sort_order"), "Sort order", {
    min: 0,
    allowEmpty: true,
  });
  if (sort.error) return fail(sort.error);

  const is_admin = formData.get("is_admin") === "on";
  const badges = parseBadges(formData);
  const user_id_raw = String(formData.get("user_id") ?? "").trim();
  const user_id = user_id_raw || null;

  const supabase = await createClient();
  const { error } = await supabase.from("owners").insert({
    display_name,
    team_name,
    wins: wins.value ?? 0,
    losses: losses.value ?? 0,
    ties: ties.value ?? 0,
    prize_money: prize.value ?? 0,
    draft_slot: draft.value,
    sort_order: sort.value ?? 0,
    is_admin,
    badges,
    user_id,
  });

  if (error) return fail(error.message);
  revalidateOwners();
  return ok("Owner created");
}

export async function updateOwner(formData: FormData): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return fail("Owner id is required");

  const display_name = String(formData.get("display_name") ?? "").trim();
  if (!display_name) return fail("Display name is required");

  const team_name = String(formData.get("team_name") ?? "").trim() || null;
  const wins = parseIntField(formData.get("wins"), "Wins", { min: 0 });
  if (wins.error) return fail(wins.error);
  const losses = parseIntField(formData.get("losses"), "Losses", { min: 0 });
  if (losses.error) return fail(losses.error);
  const ties = parseIntField(formData.get("ties"), "Ties", {
    min: 0,
    allowEmpty: true,
  });
  if (ties.error) return fail(ties.error);
  const prize = parseNumberField(formData.get("prize_money"), "Prize money", {
    min: 0,
  });
  if (prize.error) return fail(prize.error);
  const draft = parseIntField(formData.get("draft_slot"), "Draft slot", {
    min: 1,
    max: 20,
    allowEmpty: true,
  });
  if (draft.error) return fail(draft.error);
  const sort = parseIntField(formData.get("sort_order"), "Sort order", {
    min: 0,
    allowEmpty: true,
  });
  if (sort.error) return fail(sort.error);

  const is_admin = formData.get("is_admin") === "on";
  const badges = parseBadges(formData);
  const user_id_raw = String(formData.get("user_id") ?? "").trim();
  // Explicit unlink via empty string
  const user_id = user_id_raw === "" ? null : user_id_raw;

  // Prevent locking yourself out of admin accidentally if you're the only admin
  if (id === gate.owner.id && !is_admin) {
    return fail("You cannot remove admin from your own account");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("owners")
    .update({
      display_name,
      team_name,
      wins: wins.value ?? 0,
      losses: losses.value ?? 0,
      ties: ties.value ?? 0,
      prize_money: prize.value ?? 0,
      draft_slot: draft.value,
      sort_order: sort.value ?? 0,
      is_admin,
      badges,
      user_id,
    })
    .eq("id", id);

  if (error) return fail(error.message);
  revalidateOwners();
  return ok("Owner updated");
}

export async function unlinkOwnerUser(formData: FormData): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return fail("Owner id is required");
  if (id === gate.owner.id) {
    return fail("You cannot unlink your own login from this page");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("owners")
    .update({ user_id: null })
    .eq("id", id);

  if (error) return fail(error.message);
  revalidateOwners();
  return ok("User unlinked");
}
