"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "./types";
import { fail, ok } from "./types";
import { requireAdmin } from "./utils";
import { getLeagueName } from "@/lib/email/league-name";
import { getOwnerEmailRecipients } from "@/lib/email/recipients";
import { announcementEmailHtml } from "@/lib/email/templates";
import { formatEmailResult, sendEmailToOwners } from "@/lib/email/send";

function revalidateAnnouncements() {
  revalidatePath("/admin/announcements");
  revalidatePath("/dashboard");
  revalidatePath("/admin");
}

export type AnnouncementRow = {
  id: string;
  title: string;
  body: string;
  created_by: string | null;
  created_at: string;
};

export async function listAnnouncements(): Promise<AnnouncementRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("announcements")
    .select("id, title, body, created_by, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    // Table may not exist until migrate-email.sql is run
    console.error("[announcements]", error.message);
    return [];
  }

  return (data ?? []).map((r) => ({
    id: String(r.id),
    title: String(r.title),
    body: String(r.body),
    created_by: r.created_by == null ? null : String(r.created_by),
    created_at: String(r.created_at),
  }));
}

export async function createAnnouncement(
  formData: FormData
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!title) return fail("Title is required");
  if (!body) return fail("Message body is required");
  if (body.length > 5000) return fail("Message is too long (max 5000 chars)");

  const emailOwners =
    formData.get("email_owners") === "on" ||
    formData.get("email_owners") === "true";

  const supabase = await createClient();
  const { error } = await supabase.from("announcements").insert({
    title,
    body,
    created_by: gate.owner.id,
  });

  if (error) {
    if (
      error.message.includes("announcements") ||
      error.code === "42P01" ||
      error.message.includes("does not exist")
    ) {
      return fail(
        "announcements table missing — run supabase/migrate-email.sql in the Supabase SQL Editor"
      );
    }
    return fail(error.message);
  }

  revalidateAnnouncements();

  if (!emailOwners) {
    return ok("Announcement posted (email not sent)");
  }

  const leagueName = await getLeagueName();
  const content = announcementEmailHtml({ leagueName, title, body });
  const { recipients, error: recipErr } = await getOwnerEmailRecipients();
  if (recipErr) {
    return ok(`Announcement posted. Email skipped: ${recipErr}`);
  }

  const emailResult = await sendEmailToOwners({
    recipients,
    subject: content.subject,
    html: content.html,
    text: content.text,
    tags: [{ name: "category", value: "announcement" }],
  });

  return ok(formatEmailResult("Announcement posted", emailResult));
}

export async function deleteAnnouncement(
  formData: FormData
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return fail("Announcement id is required");

  const supabase = await createClient();
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) return fail(error.message);

  revalidateAnnouncements();
  return ok("Announcement deleted");
}
