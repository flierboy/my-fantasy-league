"use server";

import { revalidatePath } from "next/cache";
import { draftReportCard2026PlainText } from "@/lib/data/draft-report-card-2026";
import { getLeagueName } from "@/lib/email/league-name";
import { getOwnerEmailRecipients } from "@/lib/email/recipients";
import { draftRecapEmailHtml } from "@/lib/email/templates";
import { formatEmailResult, sendEmailToOwners } from "@/lib/email/send";
import type { ActionResult } from "./types";
import { fail, ok } from "./types";
import { requireAdmin } from "./utils";

/**
 * Email the fixed UFD 2026 Draft Report Card to opted-in owners.
 */
export async function sendDraftRecapEmail(): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const { recipients, error: recipErr } = await getOwnerEmailRecipients();
  if (recipErr) return fail(recipErr);
  if (recipients.length === 0) {
    return ok("No owner emails on file (or all opted out). Nothing to send.");
  }

  const leagueName = await getLeagueName();
  const body = draftReportCard2026PlainText();
  const content = draftRecapEmailHtml({ leagueName, body });

  const emailResult = await sendEmailToOwners({
    recipients,
    subject: content.subject,
    html: content.html,
    text: content.text,
    tags: [
      { name: "category", value: "draft_recap" },
      { name: "season", value: "2026" },
    ],
  });

  revalidatePath("/admin/sleeper");
  revalidatePath("/drafts");

  return ok(formatEmailResult("Draft report card", emailResult));
}
