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
  revalidatePath("/history");
  revalidatePath("/badges");
  revalidatePath("/admin/matchups");
  revalidatePath("/admin/dues");
}

function parseBadges(formData: FormData): BadgeKey[] {
  const raw = formData.getAll("badges").map(String);
  return raw.filter((b): b is BadgeKey => BADGE_KEYS.has(b as BadgeKey));
}

function parseEmail(formData: FormData): string | null {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return null;
  return email;
}

function parseAvatarUrl(formData: FormData): string | null {
  const url = String(formData.get("avatar_url") ?? "").trim();
  return url || null;
}

export async function createOwner(formData: FormData): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const display_name = String(formData.get("display_name") ?? "").trim();
  if (!display_name) return fail("Display name is required");

  const team_name = String(formData.get("team_name") ?? "").trim() || null;
  const email = parseEmail(formData);
  const avatar_url = parseAvatarUrl(formData);
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
    email,
    avatar_url,
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
  const email = parseEmail(formData);
  const avatar_url = parseAvatarUrl(formData);
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
  const user_id = user_id_raw === "" ? null : user_id_raw;

  if (id === gate.owner.id && !is_admin) {
    return fail("You cannot remove admin from your own account");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("owners")
    .update({
      display_name,
      team_name,
      email,
      avatar_url,
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

/**
 * Upload a selfie/avatar for an owner to Supabase Storage (bucket: avatars).
 * Then saves public URL onto owners.avatar_url.
 */
export async function uploadOwnerAvatar(
  formData: FormData
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return fail("Owner id is required");

  const file = formData.get("avatar") as File | null;
  if (!file || typeof file === "string" || file.size === 0) {
    return fail("Choose an image file to upload");
  }
  if (file.size > 5 * 1024 * 1024) {
    return fail("Image must be 5 MB or smaller");
  }
  const type = file.type || "";
  if (!type.startsWith("image/")) {
    return fail("File must be an image (jpeg, png, webp, gif)");
  }

  const ext =
    type === "image/png"
      ? "png"
      : type === "image/webp"
        ? "webp"
        : type === "image/gif"
          ? "gif"
          : "jpg";
  const path = `${id}/${Date.now()}.${ext}`;

  const supabase = await createClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, buffer, {
      contentType: type || "image/jpeg",
      upsert: true,
    });

  if (uploadError) {
    return fail(
      `Upload failed: ${uploadError.message}. Run migrate-upper-deckers-features.sql to create the avatars bucket.`
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("owners")
    .update({ avatar_url: publicUrl })
    .eq("id", id);

  if (updateError) return fail(updateError.message);

  revalidateOwners();
  return ok("Avatar uploaded");
}
