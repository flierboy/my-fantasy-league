import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all paths except static assets, PWA files, and Next internals.
     */
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|offline\\.html|manifest\\.webmanifest|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4)$).*)",
  ],
};
