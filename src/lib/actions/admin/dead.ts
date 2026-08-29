"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "./types";
import { fail, ok } from "./types";
import { requireAdmin } from "./utils";
import { parseIntField } from "./parse";

function revalidateDead() {
  revalidatePath("/dead");
  revalidatePath("/admin");
  revalidatePath("/admin/dead");
  revalidatePath("/dashboard");
}

function formatDbError(error: { message: string; code?: string }): string {
  if (error.code === "42P01" || /does not exist/i.test(error.message)) {
    return `${error.message} — run supabase/migrate-departed-owners.sql`;
  }
  return error.message;
}

export async function createDepartedOwner(
  formData: FormData
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const display_name = String(formData.get("display_name") ?? "").trim();
  if (!display_name) return fail("Name is required");

  const year = parseIntField(formData.get("departed_year"), "Year", {
    min: 1990,
    max: 2100,
  });
  if (year.error || year.value == null) {
    return fail(year.error ?? "Year required");
  }

  const epitaph = String(formData.get("epitaph") ?? "").trim();
  if (!epitaph) return fail("Epitaph is required");

  const sort = parseIntField(formData.get("sort_order"), "Sort order", {
    min: 0,
    allowEmpty: true,
  });
  if (sort.error) return fail(sort.error);

  const supabase = await createClient();
  const { error } = await supabase.from("departed_owners").insert({
    display_name,
    departed_year: year.value,
    epitaph,
    sort_order: sort.value ?? 0,
  });

  if (error) return fail(formatDbError(error));
  revalidateDead();
  return ok("Departed owner recorded");
}

export async function updateDepartedOwner(
  formData: FormData
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return fail("Id required");

  const display_name = String(formData.get("display_name") ?? "").trim();
  if (!display_name) return fail("Name is required");

  const year = parseIntField(formData.get("departed_year"), "Year", {
    min: 1990,
    max: 2100,
  });
  if (year.error || year.value == null) {
    return fail(year.error ?? "Year required");
  }

  const epitaph = String(formData.get("epitaph") ?? "").trim();
  if (!epitaph) return fail("Epitaph is required");

  const sort = parseIntField(formData.get("sort_order"), "Sort order", {
    min: 0,
    allowEmpty: true,
  });
  if (sort.error) return fail(sort.error);

  const supabase = await createClient();
  const { error } = await supabase
    .from("departed_owners")
    .update({
      display_name,
      departed_year: year.value,
      epitaph,
      sort_order: sort.value ?? 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return fail(formatDbError(error));
  revalidateDead();
  return ok("Departed owner updated");
}

export async function deleteDepartedOwner(
  formData: FormData
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return fail("Id required");

  const supabase = await createClient();
  const { error } = await supabase
    .from("departed_owners")
    .delete()
    .eq("id", id);
  if (error) return fail(formatDbError(error));

  revalidateDead();
  return ok("Departed owner deleted");
}
