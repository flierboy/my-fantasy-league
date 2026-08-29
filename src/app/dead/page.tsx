import Link from "next/link";
import { PublicPageShell } from "@/components/layout/public-page-shell";
import {
  getDepartedOwners,
  groupDepartedByYear,
} from "@/lib/data/departed-owners";
import { OwnerAvatar } from "@/components/home/owner-avatar";

export const metadata = {
  title: "Wall of the Dead",
};

export const dynamic = "force-dynamic";

export default async function DeadPage() {
  const { departed, source, error } = await getDepartedOwners();
  const groups = groupDepartedByYear(departed);

  return (
    <PublicPageShell>
      <div className="space-y-8">
        <header className="ff-welcome">
          <div className="ff-top-stripe" />
          <div className="px-5 py-6 sm:px-7">
            <p className="ff-ribbon text-[10px] !px-3 !py-1">Rest in pieces</p>
            <h1 className="ff-display mt-3 text-3xl tracking-tight sm:text-4xl">
              WALL OF THE DEAD
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Owners who left the league — name, year, and the official epitaph.
              Punishments are shame. This is rest.
            </p>
            {error && (
              <p className="mt-3 text-xs font-semibold text-amber-800">
                {error.includes("does not exist")
                  ? "Departed owners table not migrated yet — run migrate-departed-owners.sql"
                  : error}
              </p>
            )}
          </div>
        </header>

        {departed.length === 0 ? (
          <p className="ff-card p-8 text-center text-sm text-muted-foreground">
            {source === "empty" || source === "error"
              ? "Nobody's died. Yet."
              : "Nothing loaded."}
          </p>
        ) : (
          <div className="space-y-10">
            {groups.map(({ year, owners }) => (
              <section key={year} className="space-y-4">
                <h2 className="ff-display text-xl tracking-wide text-foreground">
                  Left after {year}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {owners.map((d) => (
                    <article
                      key={d.id}
                      className="relative overflow-hidden rounded-[0.9rem] border-2 border-[#141414] bg-[#0c0c0c] text-white shadow-[0_6px_18px_rgba(0,0,0,0.28)]"
                    >
                      <div
                        className="h-1.5 w-full bg-[var(--accent-gold)]"
                        aria-hidden
                      />
                      <div className="p-5 sm:p-6">
                        <div className="flex items-start gap-4">
                          <OwnerAvatar
                            name={d.display_name}
                            src={null}
                            size="md"
                            className="shrink-0 border-[var(--accent-gold)]"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent-gold)]">
                              Here lies
                            </p>
                            <p className="ff-display mt-1 text-xl tracking-wide text-white">
                              {d.display_name}
                            </p>
                            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">
                              Left after {d.departed_year}
                            </p>
                          </div>
                        </div>
                        {d.epitaph && (
                          <p className="mt-4 text-sm italic leading-relaxed text-white/80">
                            {d.epitaph}
                          </p>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <p className="text-center text-sm">
          <Link
            href="/dashboard"
            className="font-bold text-foreground underline decoration-2 underline-offset-4 hover:opacity-80"
          >
            ← Back among the living
          </Link>
        </p>
      </div>
    </PublicPageShell>
  );
}
