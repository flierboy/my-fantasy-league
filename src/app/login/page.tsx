import { Suspense } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { LoginForm } from "@/components/auth/login-form";
import { getLeagueSettings } from "@/lib/data/league";
import { getAuthUser } from "@/lib/auth/session";

export const metadata = {
  title: "Sign in",
};

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const [league, user] = await Promise.all([
    getLeagueSettings(),
    getAuthUser(),
  ]);

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader league={league} isAuthenticated={Boolean(user)} />

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <p className="ff-ribbon">Members only</p>
            <h1 className="ff-display mt-3 text-3xl tracking-tight sm:text-4xl">
              Sign in
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Accounts are invite-only. Ask the commissioner if you need access.
            </p>
          </div>

          <div className="rounded-xl border-2 border-foreground bg-white p-6 shadow-sm sm:p-8">
            <Suspense
              fallback={
                <p className="text-sm text-muted-foreground">Loading…</p>
              }
            >
              <LoginForm />
            </Suspense>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link
              href="/"
              className="font-semibold underline-offset-4 hover:underline"
            >
              ← Back to homepage
            </Link>
          </p>
        </div>
      </main>

      <SiteFooter league={league} />
    </div>
  );
}
