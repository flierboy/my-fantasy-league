/**
 * Supabase public env helpers.
 * Only NEXT_PUBLIC_* vars are used by the app (safe for browser + server).
 * Never put service-role keys in NEXT_PUBLIC_*.
 */

export function getSupabaseEnv(): {
  url: string;
  anonKey: string;
} | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function requireSupabaseEnv(): { url: string; anonKey: string } {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
  return env;
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseEnv() !== null;
}
