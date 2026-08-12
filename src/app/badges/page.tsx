import { PublicPageShell } from "@/components/layout/public-page-shell";
import { BADGE_LIST } from "@/lib/data/badges";
import { getOwners } from "@/lib/data/league";
import { OwnerBadge } from "@/components/home/owner-badge";
import { OwnerAvatar } from "@/components/home/owner-avatar";

export const metadata = {
  title: "Badges",
};

export const dynamic = "force-dynamic";

export default async function BadgesPage() {
  const owners = await getOwners();
  const wearers = owners.filter((o) => o.badges.length > 0);

  return (
    <PublicPageShell>
      <div className="space-y-10">
        <header className="ff-welcome">
          <div className="ff-top-stripe" />
          <div className="px-5 py-6 sm:px-7">
            <p className="ff-ribbon text-[10px] !px-3 !py-1">Hall of badges</p>
            <h1 className="ff-display mt-3 text-3xl tracking-tight sm:text-4xl">
              Badges
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Glory, shame, and everything in between. Admins assign badges on
              each owner record.
            </p>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2">
          {BADGE_LIST.map((badge) => (
            <article key={badge.key} className="ff-card flex gap-4 p-5">
              <span
                title={badge.label}
                className={`relative inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 text-2xl font-bold shadow-sm ${badge.className}`}
              >
                <span aria-hidden>{badge.emoji}</span>
              </span>
              <div className="min-w-0">
                <p className="ff-display text-lg tracking-wide">{badge.label}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {badge.description}
                </p>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  key · {badge.key}
                </p>
              </div>
            </article>
          ))}
        </section>

        <section>
          <p className="ff-ribbon text-[10px] !px-3 !py-1">Currently awarded</p>
          <h2 className="ff-display mt-2.5 text-2xl">On the wall</h2>
          {wearers.length === 0 ? (
            <p className="ff-card mt-4 p-6 text-sm text-muted-foreground">
              No badges assigned yet. Season 1 — clean slates for everyone.
            </p>
          ) : (
            <ul className="ff-card mt-4 divide-y-2 divide-border overflow-hidden">
              {wearers.map((owner) => (
                <li
                  key={owner.id}
                  className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:px-5"
                >
                  <OwnerAvatar
                    name={owner.display_name}
                    src={owner.avatar_url}
                    size="sm"
                  />
                  <span className="ff-display text-sm">
                    {owner.display_name}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {owner.badges.map((b) => (
                      <OwnerBadge key={b} badgeKey={b} showLabel />
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PublicPageShell>
  );
}
