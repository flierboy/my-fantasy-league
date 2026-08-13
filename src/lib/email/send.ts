import { getResendClient } from "./client";
import { getEmailFrom, isEmailConfigured } from "./config";
import type { EmailRecipient } from "./recipients";

export type SendBatchResult = {
  ok: boolean;
  sent: number;
  failed: number;
  skipped: number;
  errors: string[];
  /** Human-readable summary for admin UI */
  message: string;
};

/**
 * Send the same message to many owners via Resend.
 * Uses individual sends so one bad address doesn't kill the batch.
 * Structured for future per-user preference filtering (recipients already filtered).
 */
export async function sendEmailToOwners(opts: {
  recipients: EmailRecipient[];
  subject: string;
  html: string;
  text: string;
  /** Optional tags for Resend analytics */
  tags?: { name: string; value: string }[];
}): Promise<SendBatchResult> {
  if (!isEmailConfigured()) {
    return {
      ok: false,
      sent: 0,
      failed: 0,
      skipped: opts.recipients.length,
      errors: [
        "Email not configured — set RESEND_API_KEY (and optionally EMAIL_FROM) in env.",
      ],
      message:
        "Email not configured (missing RESEND_API_KEY). No messages sent.",
    };
  }

  if (opts.recipients.length === 0) {
    return {
      ok: true,
      sent: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      message: "No owner emails on file (or all opted out). Nothing to send.",
    };
  }

  const resend = getResendClient();
  if (!resend) {
    return {
      ok: false,
      sent: 0,
      failed: 0,
      skipped: opts.recipients.length,
      errors: ["Resend client unavailable"],
      message: "Resend client unavailable",
    };
  }

  const from = getEmailFrom();
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  // Resend allows batch; keep it simple with sequential sends for clear per-address errors
  for (const r of opts.recipients) {
    try {
      const { error } = await resend.emails.send({
        from,
        to: r.email,
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
        tags: opts.tags,
      });
      if (error) {
        failed += 1;
        errors.push(`${r.email}: ${error.message}`);
        console.error("[email] send failed", r.email, error.message);
      } else {
        sent += 1;
      }
    } catch (err) {
      failed += 1;
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${r.email}: ${msg}`);
      console.error("[email] send threw", r.email, msg);
    }
  }

  const ok = failed === 0 && sent > 0;
  const partial = sent > 0 && failed > 0;
  let message: string;
  if (ok) {
    message = `Emailed ${sent} owner${sent === 1 ? "" : "s"}.`;
  } else if (partial) {
    message = `Emailed ${sent}, failed ${failed}.`;
  } else if (failed > 0) {
    message = `All ${failed} email(s) failed. Check RESEND_API_KEY / EMAIL_FROM domain.`;
  } else {
    message = "No emails sent.";
  }

  return {
    ok: ok || partial,
    sent,
    failed,
    skipped: 0,
    errors: errors.slice(0, 10),
    message,
  };
}

/** Format batch result for ActionResult.message */
export function formatEmailResult(
  base: string,
  email: SendBatchResult
): string {
  if (email.sent === 0 && email.failed === 0 && !email.errors.length) {
    return `${base}. ${email.message}`;
  }
  if (email.errors.length && !email.ok) {
    return `${base}. ${email.message}${email.errors[0] ? ` (${email.errors[0]})` : ""}`;
  }
  return `${base}. ${email.message}`;
}
