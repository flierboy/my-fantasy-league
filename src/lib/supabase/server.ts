import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireSupabaseEnv } from "./env";

/**
 * Server-side Supabase client (Server Components, Route Handlers, Server Actions).
 * Session is stored in cookies. Uses the public anon key + RLS (not service role).
 */
export async function createClient() {
  const { url, anonKey } = requireSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // setAll can throw in pure Server Components (read-only cookies).
          // Middleware will refresh the session instead.
        }
      },
    },
  });
}
