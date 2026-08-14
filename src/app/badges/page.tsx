import { PublicPageShell } from "@/components/layout/public-page-shell";
import { badgesByCategory, getBadge } from "@/lib/data/badges";
import { getOwners } from "@/lib/data/league";
import { getBadgeAwards, latestWeekLabel } from "@/lib/data/badge-awards";
import { OwnerBadge } from "@/components/home/owner-badge";
import { OwnerAvatar } from "@/components/home/owner-avatar";

export const metadata = {
  title: "Badges",
};

export const dynamic = "force-dynamic";

export default async function BadgesPage() {
  const [owners, { awards }] = await Promise.all([
    getOwners(),
    getBadgeAwards({ limit: 200 }),
  ]);
  const wearers = owners.filter((o) => o.badges.length > 0);
  const groups = badgesByCategory();
  const totalBadges = groups.reduce((n, g) => n + g.badges.length, 0);

  // Recent weekly awards for timeline
  const recentWeekly = awards.slice(0, 24);

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
              {totalBadges} badges of glory, shame, and weekly chaos. Weekly
              awards drop after each week’s scores; season hardware is for the
              long game.
            </p>
          </div>
        </header>

        {recentWeekly.length > 0 && (
          <section>
            <p className="ff-ribbon text-[10px] !px-3 !py-1">Recent weeks</p>
            <h2 className="ff-display mt-2.5 text-2xl">Weekly awards</h2>
            <ul className="ff-card mt-4 divide-y divide-border overflow-hidden">
              {recentWeekly.map((a) => {
                const owner = owners.find((o) => o.id === a.owner_id);
                const badge = getBadge(a.badge_key);
                return (
                  <li
                    key={a.id}
                    className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm"
                  >
                    <OwnerBadge
                      badgeKey={a.badge_key}
                      weekLabel={`Week ${a.week}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">
                        {badge.label}{" "}
                        <span className="font-mono text-xs font-semibold text-muted-foreground">
                          · Week {a.week} · {a.season_year}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {owner?.display_name ?? "Owner"}
                        {a.notes ? ` — ${a.notes}` : ""}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {groups.map(({ category, badges }) => (
          <section key={category.id} className="space-y-3">
            <div>
              <p className="ff-ribbon text-[10px] !px-3 !py-1">
                {category.label}
              </p>
              <h2 className="ff-display mt-2.5 text-xl tracking-tight sm:text-2xl">
                {category.label}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {category.blurb}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {badges.map((badge) => (
                <article key={badge.key} className="ff-card flex gap-4 p-4 sm:p-5">
                  <span
                    title={badge.label}
                    className={`relative inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 text-xl font-bold shadow-sm sm:h-14 sm:w-14 sm:text-2xl ${badge.className}`}
                  >
                    <span aria-hidden>{badge.emoji}</span>
                  </span>
                  <div className="min-w-0">
                    <p className="ff-display text-base tracking-wide sm:text-lg">
                      {badge.label}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {badge.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}

        <section>
          <p className="ff-ribbon text-[10px] !px-3 !py-1">Currently awarded</p>
          <h2 className="ff-display mt-2.5 text-2xl">On the wall</h2>
          {wearers.length === 0 ? (
            <p className="ff-card mt-4 p-6 text-sm text-muted-foreground">
              No badges awarded yet. Weekly hardware starts once the season is
              underway.
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
                      <OwnerBadge
                        key={b}
                        badgeKey={b}
                        showLabel
                        weekLabel={latestWeekLabel(awards, owner.id, b)}
                      />
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
