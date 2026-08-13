import Link from "next/link";
import { PublicPageShell } from "@/components/layout/public-page-shell";
import { getPunishments } from "@/lib/data/punishments";
import { OwnerAvatar } from "@/components/home/owner-avatar";

export const metadata = {
  title: "Punishments",
};

export const dynamic = "force-dynamic";

export default async function PunishmentsPage() {
  const { punishments, source, error } = await getPunishments();

  return (
    <PublicPageShell>
      <div className="space-y-8">
        <header className="ff-welcome">
          <div className="ff-top-stripe" />
          <div className="px-5 py-6 sm:px-7">
            <p className="ff-ribbon text-[10px] !px-3 !py-1">Wall of shame</p>
            <h1 className="ff-display mt-3 text-3xl tracking-tight sm:text-4xl">
              Punishments
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Last place has consequences. The gauntlet remembers everything.
            </p>
            {error && (
              <p className="mt-3 text-xs font-semibold text-amber-800">
                {error.includes("does not exist")
                  ? "Punishment table not migrated yet — run migrate-seasons-punishments.sql"
                  : error}
              </p>
            )}
          </div>
        </header>

        {punishments.length === 0 ? (
          <p className="ff-card p-8 text-center text-sm text-muted-foreground">
            {source === "empty"
              ? "No punishments on record. Everyone is innocent (for now)."
              : "Nothing loaded."}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {punishments.map((p) => {
              const name =
                p.owner?.display_name || p.owner_label || "Unknown soul";
              return (
                <article
                  key={p.id}
                  className="ff-card relative overflow-hidden p-5 sm:p-6"
                >
                  <div className="absolute right-3 top-3 text-3xl opacity-20" aria-hidden>
                    ☠️
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    {p.season_year}
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    {p.owner ? (
                      <Link href={`/players/${p.owner.id}`}>
                        <OwnerAvatar
                          name={name}
                          src={p.owner.avatar_url}
                          size="md"
                        />
                      </Link>
                    ) : (
                      <OwnerAvatar name={name} src={null} size="md" />
                    )}
                    <div className="min-w-0">
                      {p.owner ? (
                        <Link
                          href={`/players/${p.owner.id}`}
                          className="ff-display text-lg tracking-wide hover:underline"
                        >
                          {name}
                        </Link>
                      ) : (
                        <p className="ff-display text-lg tracking-wide">
                          {name}
                        </p>
                      )}
                      <p className="text-xs font-bold uppercase tracking-wider text-red-800">
                        {p.title}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-foreground">
                    {p.description}
                  </p>
                  {p.photo_url && (
                    <p className="mt-3">
                      <a
                        href={p.photo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold uppercase tracking-wider underline"
                      >
                        Evidence / photo →
                      </a>
                    </p>
                  )}
                  {p.notes && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {p.notes}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </PublicPageShell>
  );
}
