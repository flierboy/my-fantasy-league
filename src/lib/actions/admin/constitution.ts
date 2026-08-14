"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "./types";
import { fail, ok } from "./types";
import { requireAdmin } from "./utils";
import { parseIntField } from "./parse";

function revalidateConstitution() {
  revalidatePath("/constitution");
  revalidatePath("/admin/constitution");
  revalidatePath("/admin");
}

function formatDbError(error: { message: string; code?: string }): string {
  if (error.code === "42P01" || /does not exist/i.test(error.message)) {
    return `${error.message} — run supabase/migrate-constitution.sql`;
  }
  if (error.code === "23505") {
    return "That section key already exists — pick a unique key.";
  }
  return error.message;
}

function slugKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
}

export async function updateConstitutionIntro(
  formData: FormData
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const intro = String(formData.get("constitution_intro") ?? "").trim();
  if (!intro) return fail("Intro text is required");

  const supabase = await createClient();
  const { error } = await supabase
    .from("league_settings")
    .update({
      constitution_intro: intro,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) {
    if (/constitution_intro/i.test(error.message)) {
      return fail(
        "constitution_intro column missing — run supabase/migrate-constitution.sql"
      );
    }
    return fail(formatDbError(error));
  }

  revalidateConstitution();
  return ok("Constitution intro saved");
}

export async function createConstitutionSection(
  formData: FormData
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return fail("Title is required");

  let section_key = slugKey(String(formData.get("section_key") ?? ""));
  if (!section_key) section_key = slugKey(title) || "section";

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return fail("Body is required (one rule per line)");

  const sort = parseIntField(formData.get("sort_order"), "Sort order", {
    min: 0,
    allowEmpty: true,
  });
  if (sort.error) return fail(sort.error);

  const supabase = await createClient();
  const { error } = await supabase.from("constitution_sections").insert({
    section_key,
    title,
    body,
    sort_order: sort.value ?? 0,
  });

  if (error) return fail(formatDbError(error));

  revalidateConstitution();
  return ok("Section added — live on /constitution");
}

export async function updateConstitutionSection(
  formData: FormData
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return fail("Section id is required");

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return fail("Title is required");

  let section_key = slugKey(String(formData.get("section_key") ?? ""));
  if (!section_key) section_key = slugKey(title) || "section";

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return fail("Body is required (one rule per line)");

  const sort = parseIntField(formData.get("sort_order"), "Sort order", {
    min: 0,
    allowEmpty: true,
  });
  if (sort.error) return fail(sort.error);

  const supabase = await createClient();
  const { error } = await supabase
    .from("constitution_sections")
    .update({
      section_key,
      title,
      body,
      sort_order: sort.value ?? 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return fail(formatDbError(error));

  revalidateConstitution();
  return ok("Section saved — live on /constitution");
}

export async function deleteConstitutionSection(
  formData: FormData
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return fail("Section id is required");

  const supabase = await createClient();
  const { error } = await supabase
    .from("constitution_sections")
    .delete()
    .eq("id", id);

  if (error) return fail(formatDbError(error));

  revalidateConstitution();
  return ok("Section deleted");
}

/** Move section up/down by swapping sort_order with neighbor. */
export async function reorderConstitutionSection(
  formData: FormData
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const id = String(formData.get("id") ?? "").trim();
  const direction = String(formData.get("direction") ?? "").trim();
  if (!id) return fail("Section id is required");
  if (direction !== "up" && direction !== "down") {
    return fail("Direction must be up or down");
  }

  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("constitution_sections")
    .select("id, sort_order")
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });

  if (error) return fail(formatDbError(error));
  const list = rows ?? [];
  const idx = list.findIndex((r) => r.id === id);
  if (idx < 0) return fail("Section not found");

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= list.length) {
    return ok("Already at the end");
  }

  const a = list[idx];
  const b = list[swapIdx];
  // Swap sort orders (use temp offset if equal)
  let aOrder = Number(a.sort_order);
  let bOrder = Number(b.sort_order);
  if (aOrder === bOrder) {
    aOrder = idx * 10;
    bOrder = swapIdx * 10;
  }

  const { error: e1 } = await supabase
    .from("constitution_sections")
    .update({ sort_order: bOrder, updated_at: new Date().toISOString() })
    .eq("id", a.id);
  if (e1) return fail(formatDbError(e1));

  const { error: e2 } = await supabase
    .from("constitution_sections")
    .update({ sort_order: aOrder, updated_at: new Date().toISOString() })
    .eq("id", b.id);
  if (e2) return fail(formatDbError(e2));

  revalidateConstitution();
  return ok(direction === "up" ? "Moved up" : "Moved down");
}
