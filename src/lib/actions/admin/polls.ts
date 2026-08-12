"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "./types";
import { fail, ok } from "./types";
import { requireAdmin } from "./utils";

function revalidatePolls() {
  revalidatePath("/polls");
  revalidatePath("/admin/polls");
  revalidatePath("/dashboard");
}

export async function createPoll(formData: FormData): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return fail("Title is required");

  const description =
    String(formData.get("description") ?? "").trim() || null;

  const optionsRaw = String(formData.get("options") ?? "");
  const options = optionsRaw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  if (options.length < 2) {
    return fail("Enter at least two options (one per line)");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("polls").insert({
    title,
    description,
    options,
    created_by: gate.owner.id,
    is_active: true,
  });

  if (error) return fail(error.message);
  revalidatePolls();
  return ok("Poll created");
}

export async function setPollActive(formData: FormData): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return fail("Poll id is required");

  const is_active = formData.get("is_active") === "true";

  const supabase = await createClient();
  const { error } = await supabase
    .from("polls")
    .update({ is_active })
    .eq("id", id);

  if (error) return fail(error.message);
  revalidatePolls();
  return ok(is_active ? "Poll opened" : "Poll closed");
}

export async function deletePoll(formData: FormData): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return fail("Poll id is required");

  const supabase = await createClient();
  const { error } = await supabase.from("polls").delete().eq("id", id);
  if (error) return fail(error.message);
  revalidatePolls();
  return ok("Poll deleted");
}
