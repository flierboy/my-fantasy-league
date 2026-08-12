import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/matchups",
  "/dues",
  "/polls",
  "/trash-talk",
  "/admin",
] as const;

function isProtectedPath(path: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}

/**
 * Refresh the Supabase session on every request and gate protected routes.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const path = request.nextUrl.pathname;
  const env = getSupabaseEnv();

  // No Supabase config → cannot verify sessions; lock private area.
  if (!env) {
    if (isProtectedPath(path)) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("next", path);
      return NextResponse.redirect(loginUrl);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isProtectedPath(path) && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }

  if (path === "/login" && user) {
    const next = request.nextUrl.searchParams.get("next");
    const dest =
      next && next.startsWith("/") && !next.startsWith("//")
        ? next
        : "/dashboard";
    const dash = request.nextUrl.clone();
    dash.pathname = dest;
    dash.search = "";
    return NextResponse.redirect(dash);
  }

  return supabaseResponse;
}
