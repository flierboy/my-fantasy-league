import Link from "next/link";
import { getLeagueSettings } from "@/lib/data/league";
import { getSessionContext } from "@/lib/auth/session";
import {
  getMatchupsData,
  getDuesData,
  getPollsData,
  getTrashTalkData,
} from "@/lib/data/dashboard";
import { formatMoney, formatRecord, cn } from "@/lib/utils";
import { DraftCountdown } from "@/components/home/draft-countdown";
import { OwnerAvatar } from "@/components/home/owner-avatar";
import { DEFAULT_DRAFT_AT } from "@/lib/types";

export const metadata = {
  title: "Dashboard",
};

const TILES = [
  {
    href: "/matchups",
    icon: "📅",
    title: "Matchups",
    blurb: "Weekly scores & standings",
  },
  {
    href: "/dues",
    icon: "💵",
    title: "Dues",
    blurb: "Payments & prize pool",
  },
  {
    href: "/polls",
    icon: "📊",
    title: "Polls",
    blurb: "Vote on league decisions",
  },
  {
    href: "/trash-talk",
    icon: "💬",
    title: "Trash talk",
    blurb: "Message board / smack",
  },
  {
    href: "/history",
    icon: "📜",
    title: "History",
    blurb: "Champions & all-time records",
  },
  {
    href: "/badges",
    icon: "🎖️",
    title: "Badges",
    blurb: "Hall of glory & shame",
  },
  {
    href: "/constitution",
    icon: "📖",
    title: "Constitution",
    blurb: "Rules of the league",
  },
  {
    href: "/players",
    icon: "👥",
    title: "Players",
    blurb: "Roster cards, cash & badges",
  },
  {
    href: "/admin",
    icon: "⚙️",
    title: "Admin",
    blurb: "Records, draft, badges",
    adminOnly: true,
  },
];

export default async function DashboardPage() {
  const [league, { owner, isAdmin }, matchupsData, dues, polls, trash] =
    await Promise.all([
      getLeagueSettings(),
      getSessionContext(),
      getMatchupsData(),
      getDuesData(),
      getPollsData(),
      getTrashTalkData(),
    ]);

  const paidCount = dues.payments.filter(
    (p) => p.amount_paid >= p.amount_due && p.amount_due > 0
  ).length;
  const collected = dues.payments.reduce((s, p) => s + p.amount_paid, 0);

  const tiles = TILES.filter((t) => !t.adminOnly || isAdmin);

  // This week's matchup for logged-in owner
  const currentWeek = matchupsData.week;
  const myMatchup =
    owner && currentWeek != null
      ? matchupsData.matchups.find(
          (m) =>
            m.week === currentWeek &&
            (m.home_owner_id === owner.id || m.away_owner_id === owner.id)
        )
      : null;

  const myDues = owner
    ? dues.payments.find((p) => p.owner_id === owner.id)
    : null;
  const myDuesPaid =
    myDues != null &&
    myDues.amount_due > 0 &&
    myDues.amount_paid >= myDues.amount_due;

  const standingsSnippet = matchupsData.standings.slice(0, 5);

  const lastSync = league.last_sleeper_sync_at
    ? new Date(league.last_sleeper_sync_at)
    : null;

  return (
    <div className="space-y-8">
      <section className="ff-welcome">
        <div className="ff-top-stripe" />
        <div className="px-5 py-6 sm:px-7 sm:py-7">
          <p className="ff-ribbon text-[10px] !px-3 !py-1">Private</p>
          <h1 className="ff-display mt-3 text-3xl tracking-tight sm:text-4xl">
            League hub
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
            Welcome{owner ? `, ${owner.display_name}` : ""} — {league.name} ·{" "}
            {league.season_year}
            {isAdmin ? " · Commissioner tools unlocked" : ""}
          </p>
          {lastSync && !Number.isNaN(lastSync.getTime()) && (
            <p className="mt-2 text-[11px] font-semibold text-muted-foreground">
              Last Sleeper sync ·{" "}
              {lastSync.toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>
      </section>

      <DraftCountdown draftAt={league.draft_at || DEFAULT_DRAFT_AT} compact />

      {/* This week’s matchup */}
      {owner && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="ff-ribbon text-[10px] !px-3 !py-1">Your game</p>
              <h2 className="ff-display mt-2 text-xl tracking-tight">
                {currentWeek != null ? `Week ${currentWeek}` : "This week"}
              </h2>
            </div>
            <Link
              href={
                currentWeek != null
                  ? `/matchups?week=${currentWeek}`
                  : "/matchups"
              }
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground underline"
            >
              All matchups →
            </Link>
          </div>
          {!myMatchup ? (
            <div className="ff-card border-dashed p-5 text-sm text-muted-foreground">
              No matchups yet — check back after Week 1.
            </div>
          ) : (
            <MyMatchupCard
              matchup={myMatchup}
              ownerId={owner.id}
            />
          )}
        </section>
      )}

      {/* Compact standings + dues chip */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="ff-ribbon text-[10px] !px-3 !py-1">Table</p>
              <h2 className="ff-display mt-2 text-xl tracking-tight">
                Standings
              </h2>
            </div>
            <Link
              href="/matchups"
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground underline"
            >
              Full table →
            </Link>
          </div>
          {standingsSnippet.length === 0 ? (
            <div className="ff-card border-dashed p-5 text-sm text-muted-foreground">
              Standings appear once the season is underway.
            </div>
          ) : (
            <ol className="ff-card divide-y divide-border overflow-hidden">
              {standingsSnippet.map((row, idx) => {
                const name = row.owner?.display_name ?? "—";
                const isMe = owner && row.owner_id === owner.id;
                return (
                  <li
                    key={row.id}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 text-sm",
                      isMe && "bg-amber-50/80"
                    )}
                  >
                    <span className="w-6 font-mono font-bold tabular-nums text-muted-foreground">
                      {row.rank || idx + 1}
                    </span>
                    {row.owner && (
                      <OwnerAvatar name={name} src={row.owner.avatar_url} size="sm" />
                    )}
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate ff-display text-sm",
                        isMe && "font-bold"
                      )}
                    >
                      {name}
                      {isMe ? " · you" : ""}
                    </span>
                    <span className="font-mono text-xs font-bold tabular-nums">
                      {formatRecord(row.wins, row.losses, row.ties)}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <section className="space-y-3">
          <div>
            <p className="ff-ribbon text-[10px] !px-3 !py-1">Quick looks</p>
            <h2 className="ff-display mt-2 text-xl tracking-tight">Status</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <HubStat
              label="Matchups logged"
              value={
                matchupsData.matchups.length
                  ? `Week ${matchupsData.week ?? "—"} · ${matchupsData.matchups.length}`
                  : "None yet"
              }
              href="/matchups"
            />
            <HubStat
              label="Dues collected"
              value={`${formatMoney(collected)} · ${paidCount}/${dues.payments.length}`}
              href="/dues"
            />
            {myDues && (
              <div
                className={cn(
                  "ff-card p-4",
                  myDuesPaid
                    ? "border-emerald-700/40 bg-emerald-50/50"
                    : "border-amber-700/40 bg-amber-50/50"
                )}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Your dues
                </p>
                <p className="ff-display mt-1 text-lg">
                  {myDuesPaid ? "Paid ✓" : "Outstanding"}
                </p>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                  {formatMoney(myDues.amount_paid)} /{" "}
                  {formatMoney(myDues.amount_due)}
                </p>
                <Link
                  href="/dues"
                  className="mt-2 inline-block text-[10px] font-bold uppercase tracking-wider underline"
                >
                  Dues board →
                </Link>
              </div>
            )}
            <HubStat
              label="Activity"
              value={`${polls.polls.length} polls · ${trash.posts.length} posts`}
              href="/polls"
            />
          </div>
        </section>
      </div>

      <div>
        <div className="mb-4">
          <p className="ff-ribbon text-[10px] !px-3 !py-1">Clubhouse</p>
          <h2 className="ff-display mt-2 text-xl tracking-tight sm:text-2xl">
            Jump in
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-3.5">
          {tiles.map((tile) => (
            <Link
              key={tile.href + tile.title}
              href={tile.href}
              className="ff-hub-tile"
            >
              <span className="ff-hub-icon" aria-hidden>
                {tile.icon}
              </span>
              <span>{tile.title}</span>
              <span className="ff-hub-blurb">{tile.blurb}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function MyMatchupCard({
  matchup,
  ownerId,
}: {
  matchup: {
    home_owner_id: string;
    away_owner_id: string;
    home_score: number | null;
    away_score: number | null;
    is_complete: boolean;
    home_owner?: { display_name: string; avatar_url: string | null } | null;
    away_owner?: { display_name: string; avatar_url: string | null } | null;
  };
  ownerId: string;
}) {
  const iAmHome = matchup.home_owner_id === ownerId;
  const me = iAmHome ? matchup.home_owner : matchup.away_owner;
  const opp = iAmHome ? matchup.away_owner : matchup.home_owner;
  const myScore = iAmHome ? matchup.home_score : matchup.away_score;
  const oppScore = iAmHome ? matchup.away_score : matchup.home_score;
  const won =
    matchup.is_complete &&
    myScore != null &&
    oppScore != null &&
    myScore > oppScore;
  const lost =
    matchup.is_complete &&
    myScore != null &&
    oppScore != null &&
    myScore < oppScore;

  return (
    <div className="ff-card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {me && (
            <OwnerAvatar
              name={me.display_name}
              src={me.avatar_url}
              size="md"
            />
          )}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              You
            </p>
            <p className="ff-display text-lg">{me?.display_name ?? "You"}</p>
            <p className="font-mono text-2xl font-bold tabular-nums">
              {myScore != null ? myScore.toFixed(1) : "—"}
            </p>
          </div>
        </div>
        <div className="text-center">
          <p className="ff-display text-xs text-muted-foreground">
            {matchup.is_complete
              ? won
                ? "WIN"
                : lost
                  ? "LOSS"
                  : "TIE"
              : "VS"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Opponent
            </p>
            <p className="ff-display text-lg">
              {opp?.display_name ?? "TBD"}
            </p>
            <p className="font-mono text-2xl font-bold tabular-nums">
              {oppScore != null ? oppScore.toFixed(1) : "—"}
            </p>
          </div>
          {opp && (
            <OwnerAvatar
              name={opp.display_name}
              src={opp.avatar_url}
              size="md"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function HubStat({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <>
      <p className="pl-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="ff-display mt-1.5 pl-1 text-lg tracking-wide tabular-nums sm:text-xl">
        {value}
      </p>
    </>
  );
  if (href) {
    return (
      <Link href={href} className="ff-stat-card block transition-opacity hover:opacity-90">
        {inner}
      </Link>
    );
  }
  return <div className="ff-stat-card">{inner}</div>;
}
