import Link from "next/link";
import { PublicPageShell } from "@/components/layout/public-page-shell";
import { getDraftYears, groupPicksByRound } from "@/lib/data/drafts";
import { ScrollableTable } from "@/components/ui/scrollable-table";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Drafts",
};

export const dynamic = "force-dynamic";

export default async function DraftsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const sp = await searchParams;
  const { years, error, source } = await getDraftYears({ withPicks: true });

  const selectedYear =
    (sp.year ? Number(sp.year) : null) ||
    years[0]?.season_year ||
    null;

  const active =
    years.find((y) => y.season_year === selectedYear) ?? years[0] ?? null;
  const picks = active?.picks ?? [];
  const byRound = groupPicksByRound(picks);
  const rounds = [...byRound.keys()].sort((a, b) => a - b);

  return (
    <PublicPageShell>
      <div className="space-y-8">
        <header className="ff-welcome">
          <div className="ff-top-stripe" />
          <div className="px-5 py-6 sm:px-7">
            <p className="ff-ribbon text-[10px] !px-3 !py-1">Draft boards</p>
            <h1 className="ff-display mt-3 text-3xl tracking-tight sm:text-4xl">
              Draft history
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Round-by-round boards from past seasons. Linked owners jump to
              their profile.
            </p>
            {error && (
              <p className="mt-3 text-xs font-semibold text-amber-800">
                {error.includes("does not exist")
                  ? "Run supabase/migrate-draft-history.sql to enable draft history."
                  : error}
              </p>
            )}
          </div>
        </header>

        {years.length === 0 ? (
          <p className="ff-card p-8 text-center text-sm text-muted-foreground">
            {source === "empty"
              ? "No draft boards yet — check back after draft day."
              : "Draft history isn’t available right now."}
          </p>
        ) : (
          <>
            {/* Year tabs */}
            <div className="flex flex-wrap gap-2">
              {years.map((y) => {
                const activeTab = y.season_year === active?.season_year;
                return (
                  <Link
                    key={y.id}
                    href={`/drafts?year=${y.season_year}`}
                    className={cn(
                      "rounded-lg border-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors",
                      activeTab
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-white text-muted-foreground hover:border-foreground hover:text-foreground"
                    )}
                  >
                    {y.season_year}
                    <span className="ml-1.5 font-mono font-normal opacity-70">
                      {y.source}
                    </span>
                  </Link>
                );
              })}
            </div>

            {active && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <h2 className="ff-display text-2xl">
                      {active.season_year} draft
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Source: {active.source.toUpperCase()} · {picks.length}{" "}
                      picks
                      {active.notes ? ` · ${active.notes}` : ""}
                    </p>
                  </div>
                </div>

                {picks.length === 0 ? (
                  <p className="ff-card p-6 text-sm text-muted-foreground">
                    No picks imported for this year yet.
                  </p>
                ) : (
                  rounds.map((round) => {
                    const roundPicks = byRound.get(round) ?? [];
                    return (
                      <section key={round}>
                        <p className="ff-ribbon text-[10px] !px-3 !py-1">
                          Round {round}
                        </p>
                        <ScrollableTable
                          className="mt-3"
                          minWidth="32rem"
                          hint="Swipe for Pos · NFL · team"
                        >
                          <table className="w-full text-sm">
                            <thead className="border-b-2 border-foreground bg-[#f4f2ef] text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              <tr>
                                <th className="px-3 py-2.5 sm:px-4">Pick</th>
                                <th className="px-3 py-2.5 sm:px-4">Player</th>
                                <th className="px-3 py-2.5 sm:px-4">Pos</th>
                                <th className="px-3 py-2.5 sm:px-4">NFL</th>
                                <th className="px-3 py-2.5 sm:px-4">
                                  Fantasy team
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {roundPicks.map((p) => (
                                <tr key={p.id}>
                                  <td className="px-3 py-2.5 font-mono text-xs font-bold sm:px-4">
                                    {p.overall_pick}
                                    <span className="ml-1 text-muted-foreground">
                                      ({p.round}.{p.pick_in_round})
                                    </span>
                                  </td>
                                  <td className="px-3 py-2.5 font-semibold sm:px-4">
                                    {p.player_name}
                                  </td>
                                  <td className="px-3 py-2.5 font-mono text-xs sm:px-4">
                                    {p.position || "—"}
                                  </td>
                                  <td className="px-3 py-2.5 font-mono text-xs sm:px-4">
                                    {p.nfl_team || "—"}
                                  </td>
                                  <td className="px-3 py-2.5 sm:px-4">
                                    {p.owner_id ? (
                                      <Link
                                        href={`/players/${p.owner_id}`}
                                        className="ff-display text-xs tracking-wide hover:underline sm:text-sm"
                                      >
                                        {p.owner?.display_name ||
                                          p.fantasy_owner_name}
                                      </Link>
                                    ) : (
                                      <span className="text-xs font-semibold text-muted-foreground sm:text-sm">
                                        {p.fantasy_owner_name || "—"}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </ScrollableTable>
                      </section>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}
      </div>
    </PublicPageShell>
  );
}
