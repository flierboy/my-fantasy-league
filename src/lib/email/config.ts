/**
 * Email / Resend configuration from env.
 * RESEND_API_KEY is required to send; without it, send helpers no-op with a clear error.
 */

export function getResendApiKey(): string | null {
  const key = process.env.RESEND_API_KEY?.trim();
  return key || null;
}

/** e.g. "Upper Deckers <league@yourdomain.com>" or "onboarding@resend.dev" for testing */
export function getEmailFrom(): string {
  return (
    process.env.EMAIL_FROM?.trim() ||
    "Upper Deckers <onboarding@resend.dev>"
  );
}

/** Public site origin for links in emails */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return `https://${host}`;
  }

  return "http://localhost:3000";
}

export function isEmailConfigured(): boolean {
  return Boolean(getResendApiKey());
}
