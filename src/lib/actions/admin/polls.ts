"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "./types";
import { fail, ok } from "./types";
import { requireAdmin } from "./utils";
import { getLeagueName } from "@/lib/email/league-name";
import { getOwnerEmailRecipients } from "@/lib/email/recipients";
import { pollEmailHtml } from "@/lib/email/templates";
import { formatEmailResult, sendEmailToOwners } from "@/lib/email/send";

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

  // Default ON: checkbox present when checked; hidden input "on" when default
  const emailOwners =
    formData.get("email_owners") === "on" ||
    formData.get("email_owners") === "true";

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

  if (!emailOwners) {
    return ok("Poll created (email not sent)");
  }

  const leagueName = await getLeagueName();
  const content = pollEmailHtml({
    leagueName,
    title,
    description,
    options,
  });
  const { recipients, error: recipErr } = await getOwnerEmailRecipients();
  if (recipErr) {
    return ok(`Poll created. Email skipped: ${recipErr}`);
  }

  const emailResult = await sendEmailToOwners({
    recipients,
    subject: content.subject,
    html: content.html,
    text: content.text,
    tags: [{ name: "category", value: "poll" }],
  });

  return ok(formatEmailResult("Poll created", emailResult));
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
