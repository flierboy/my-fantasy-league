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
  revalidatePath("/players");
  revalidatePath("/admin");
  revalidatePath("/admin/owners");
  revalidatePath("/admin/owners/bulk");
  revalidatePath("/dashboard");
  revalidatePath("/matchups");
  revalidatePath("/dues");
  revalidatePath("/history");
  revalidatePath("/badges");
  revalidatePath("/admin/matchups");
  revalidatePath("/admin/dues");
}

type OwnerWritePayload = {
  display_name: string;
  team_name: string | null;
  role: string | null;
  email: string | null;
  avatar_url: string | null;
  wins?: number;
  losses?: number;
  ties?: number;
  prize_money: number;
  draft_slot?: number | null;
  sort_order?: number;
  is_admin: boolean;
  badges?: BadgeKey[];
  user_id?: string | null;
  favorite_nfl_team: string | null;
  sleeper_username: string | null;
};

/** Retry without optional columns if migrations not applied yet. */
async function updateOwnerRow(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string,
  payload: OwnerWritePayload
) {
  let { error } = await supabase.from("owners").update(payload).eq("id", id);
  if (!error) return { error: null as string | null, stripped: [] as string[] };

  const stripped: string[] = [];
  let next: Record<string, unknown> = { ...payload };

  if (error.message.includes("favorite_nfl_team")) {
    delete next.favorite_nfl_team;
    stripped.push("favorite_nfl_team");
    ({ error } = await supabase.from("owners").update(next).eq("id", id));
  }
  if (error?.message.includes("sleeper_username")) {
    delete next.sleeper_username;
    stripped.push("sleeper_username");
    ({ error } = await supabase.from("owners").update(next).eq("id", id));
  }
  if (error?.message.includes("role")) {
    delete next.role;
    stripped.push("role");
    ({ error } = await supabase.from("owners").update(next).eq("id", id));
  }

  return {
    error: error?.message ?? null,
    stripped,
  };
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
  const role = String(formData.get("role") ?? "").trim() || null;
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
  const favorite_nfl_team =
    String(formData.get("favorite_nfl_team") ?? "").trim() || null;
  const sleeper_username =
    String(formData.get("sleeper_username") ?? "").trim() || null;

  const supabase = await createClient();
  const payload: OwnerWritePayload = {
    display_name,
    team_name,
    role,
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
    favorite_nfl_team,
    sleeper_username,
  };
  let { error } = await supabase.from("owners").insert(payload);

  // Drop optional columns if migrations not applied yet
  if (error?.message?.includes("favorite_nfl_team")) {
    const { favorite_nfl_team: _f, ...rest } = payload;
    ({ error } = await supabase.from("owners").insert(rest));
  }
  if (error?.message?.includes("sleeper_username")) {
    const { sleeper_username: _s, ...rest } = payload;
    const { favorite_nfl_team: _f, ...rest2 } = rest as OwnerWritePayload;
    ({ error } = await supabase.from("owners").insert(rest2));
  }
  if (error?.message?.includes("role")) {
    const { role: _r, favorite_nfl_team: _f, sleeper_username: _s, ...rest } =
      payload;
    ({ error } = await supabase.from("owners").insert(rest));
  }

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
  const role = String(formData.get("role") ?? "").trim() || null;
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
  const favorite_nfl_team =
    String(formData.get("favorite_nfl_team") ?? "").trim() || null;
  const sleeper_username =
    String(formData.get("sleeper_username") ?? "").trim() || null;

  if (id === gate.owner.id && !is_admin) {
    return fail("You cannot remove admin from your own account");
  }

  const supabase = await createClient();
  const payload: OwnerWritePayload = {
    display_name,
    team_name,
    role,
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
    favorite_nfl_team,
    sleeper_username,
  };
  const result = await updateOwnerRow(supabase, id, payload);

  if (result.error) return fail(result.error);
  if (result.stripped.length) {
    revalidateOwners();
    return ok(
      `Owner updated (missing columns skipped: ${result.stripped.join(", ")} — run migrate-owner-bulk-fields.sql / migrate-owner-role.sql)`
    );
  }
  revalidateOwners();
  return ok("Owner updated");
}

export type BulkOwnerRow = {
  id: string;
  display_name: string;
  team_name: string;
  email: string;
  avatar_url: string;
  role: string;
  prize_money: number | string;
  favorite_nfl_team: string;
  sleeper_username: string;
  is_admin: boolean;
};

/**
 * Save many owners in one shot (bulk league setup).
 * Expects FormData field `payload` = JSON array of BulkOwnerRow.
 */
export async function bulkUpdateOwners(
  formData: FormData
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const raw = String(formData.get("payload") ?? "").trim();
  if (!raw) return fail("No owner payload provided");

  let rows: BulkOwnerRow[];
  try {
    rows = JSON.parse(raw) as BulkOwnerRow[];
  } catch {
    return fail("Invalid bulk payload JSON");
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return fail("Payload must be a non-empty array of owners");
  }

  const adminId = gate.owner.id;
  const wouldStripSelfAdmin = rows.some(
    (r) => r.id === adminId && !r.is_admin
  );
  if (wouldStripSelfAdmin) {
    return fail("You cannot remove admin from your own account");
  }

  const supabase = await createClient();
  let updated = 0;
  const errors: string[] = [];
  const strippedHints = new Set<string>();

  for (const row of rows) {
    const id = String(row.id ?? "").trim();
    if (!id) {
      errors.push("Row missing id");
      continue;
    }
    const display_name = String(row.display_name ?? "").trim();
    if (!display_name) {
      errors.push(`Row ${id}: display name required`);
      continue;
    }

    const prizeRaw = row.prize_money;
    const prize_money =
      typeof prizeRaw === "number"
        ? prizeRaw
        : Number(String(prizeRaw ?? "0").replace(/[$,]/g, ""));
    if (!Number.isFinite(prize_money) || prize_money < 0) {
      errors.push(`${display_name}: invalid career cash`);
      continue;
    }

    const payload: OwnerWritePayload = {
      display_name,
      team_name: String(row.team_name ?? "").trim() || null,
      email: String(row.email ?? "").trim() || null,
      avatar_url: String(row.avatar_url ?? "").trim() || null,
      role: String(row.role ?? "").trim() || null,
      prize_money,
      favorite_nfl_team:
        String(row.favorite_nfl_team ?? "").trim() || null,
      sleeper_username:
        String(row.sleeper_username ?? "").trim() || null,
      is_admin: Boolean(row.is_admin),
    };

    const result = await updateOwnerRow(supabase, id, payload);
    if (result.error) {
      errors.push(`${display_name}: ${result.error}`);
      continue;
    }
    result.stripped.forEach((c) => strippedHints.add(c));
    updated += 1;
  }

  revalidateOwners();

  if (updated === 0) {
    return fail(errors.join("; ") || "No owners updated");
  }

  const parts = [`Saved ${updated} owner${updated === 1 ? "" : "s"}`];
  if (errors.length) parts.push(`${errors.length} error(s): ${errors.join("; ")}`);
  if (strippedHints.size) {
    parts.push(
      `Run supabase/migrate-owner-bulk-fields.sql for: ${[...strippedHints].join(", ")}`
    );
  }
  return ok(parts.join(" · "));
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
  return ok("Avatar uploaded", { avatar_url: publicUrl });
}
