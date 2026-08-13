import { createClient } from "@/lib/supabase/server";

export type EmailRecipient = {
  email: string;
  displayName: string;
  ownerId: string;
};

/**
 * Owners with a non-empty email who have not opted out.
 * `email_opt_out` is optional until migrate-email.sql is applied —
 * missing column is treated as false (everyone eligible).
 */
export async function getOwnerEmailRecipients(): Promise<{
  recipients: EmailRecipient[];
  error?: string;
}> {
  const supabase = await createClient();

  // Prefer selecting opt-out; fall back if column missing
  let rows: Record<string, unknown>[] | null = null;
  let errMsg: string | undefined;

  const withOptOut = await supabase
    .from("owners")
    .select("id, display_name, email, email_opt_out")
    .not("email", "is", null);

  if (withOptOut.error) {
    const fallback = await supabase
      .from("owners")
      .select("id, display_name, email")
      .not("email", "is", null);
    if (fallback.error) {
      return { recipients: [], error: fallback.error.message };
    }
    rows = (fallback.data ?? []) as Record<string, unknown>[];
    errMsg = undefined;
  } else {
    rows = (withOptOut.data ?? []) as Record<string, unknown>[];
  }

  if (errMsg) return { recipients: [], error: errMsg };

  const recipients: EmailRecipient[] = [];
  for (const row of rows ?? []) {
    const email = String(row.email ?? "").trim();
    if (!email || !email.includes("@")) continue;
    if (row.email_opt_out === true) continue;
    recipients.push({
      email,
      displayName: String(row.display_name ?? "Owner"),
      ownerId: String(row.id),
    });
  }

  // Dedupe by email (case-insensitive)
  const seen = new Set<string>();
  const unique = recipients.filter((r) => {
    const key = r.email.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return { recipients: unique };
}
