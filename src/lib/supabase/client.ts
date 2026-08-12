import { createBrowserClient } from "@supabase/ssr";
import { requireSupabaseEnv } from "./env";

/**
 * Browser-side Supabase client (Client Components).
 * Uses public anon key only — never the service role.
 */
export function createClient() {
  const { url, anonKey } = requireSupabaseEnv();
  return createBrowserClient(url, anonKey);
}
