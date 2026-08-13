import { Resend } from "resend";
import { getResendApiKey } from "./config";

let cached: Resend | null = null;

export function getResendClient(): Resend | null {
  const key = getResendApiKey();
  if (!key) return null;
  if (!cached) cached = new Resend(key);
  return cached;
}
