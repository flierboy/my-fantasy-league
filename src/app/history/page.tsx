import { PublicPageShell } from "@/components/layout/public-page-shell";
import { getOwners } from "@/lib/data/league";
import {
  ALL_TIME_BLURB,
  CHAMPIONS,
  MILESTONES,
} from "@/lib/data/history";
import { formatRecord } from "@/lib/utils";
import { OwnerAvatar } from "@/components/home/owner-avatar";

export const metadata = {
  title: "History",
};

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const owners = await getOwners();
  const sorted = [...owners].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (a.losses !== b.losses) return a.losses - b.losses;
    return a.sort_order - b.sort_order;
  });

  return (
    <PublicPageShell>
      <div className="space-y-10">
        <header className="ff-welcome">
          <div className="ff-top-stripe" />
          <div className="px-5 py-6 sm:px-7">
            <p className="ff-ribbon text-[10px] !px-3 !py-1">Legacy</p>
            <h1 className="ff-display mt-3 text-3xl tracking-tight sm:text-4xl">
              League history
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Champions, scars, and the long road to the hardware.{" "}
              {ALL_TIME_BLURB}
            </p>
          </div>
        </header>

        <section>
          <p className="ff-ribbon text-[10px] !px-3 !py-1">The hardware</p>
          <h2 className="ff-display mt-2.5 text-2xl">Trophy wall</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {CHAMPIONS.map((c) => (
              <article key={c.season} className="ff-card p-5 sm:p-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Season {c.season}
                </p>
                <p className="ff-display mt-2 text-2xl tracking-tight">
                  🏆 {c.champion}
                </p>
                {c.runnerUp && (
                  <p className="mt-1 text-sm font-semibold text-muted-foreground">
                    Runner-up · {c.runnerUp}
                  </p>
                )}
                {c.note && (
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {c.note}
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>

        <section>
          <p className="ff-ribbon text-[10px] !px-3 !py-1">Timeline</p>
          <h2 className="ff-display mt-2.5 text-2xl">Milestones</h2>
          <ol className="ff-card mt-4 divide-y-2 divide-border overflow-hidden">
            {MILESTONES.map((m) => (
              <li
                key={m.year + m.title}
                className="flex gap-4 px-4 py-4 sm:px-5"
              >
                <span className="ff-display flex h-12 w-14 shrink-0 items-center justify-center rounded-lg border-2 border-foreground bg-[#f4f2ef] text-xs shadow-[2px_2px_0_0_#141414]">
                  {m.year}
                </span>
                <div>
                  <p className="ff-display text-base">{m.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {m.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <p className="ff-ribbon text-[10px] !px-3 !py-1">Franchise</p>
          <h2 className="ff-display mt-2.5 text-2xl">All-time records</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Franchise W-L as tracked on the site (starts fresh for 2026).
          </p>
          <div className="ff-card mt-4 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b-2 border-foreground bg-[#f4f2ef] text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3 text-right">W-L</th>
                  <th className="hidden px-4 py-3 text-right sm:table-cell">
                    Prize $
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sorted.map((owner, idx) => (
                  <tr key={owner.id}>
                    <td className="px-4 py-3 font-mono font-bold">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <OwnerAvatar
                          name={owner.display_name}
                          src={owner.avatar_url}
                          size="sm"
                        />
                        <span className="ff-display text-sm">
                          {owner.display_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold tabular-nums">
                      {formatRecord(owner.wins, owner.losses, owner.ties)}
                    </td>
                    <td className="hidden px-4 py-3 text-right font-mono text-muted-foreground sm:table-cell">
                      ${owner.prize_money.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </PublicPageShell>
  );
}
