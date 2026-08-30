import Link from "next/link";
import { getLeagueSettings } from "@/lib/data/league";
import { getSessionContext } from "@/lib/auth/session";
import {
  getMatchupsData,
  getDuesData,
  getPollsData,
  getTrashTalkData,
} from "@/lib/data/dashboard";
import { getLeagueEvents } from "@/lib/data/events";
import { formatEventWhenEt } from "@/lib/data/events-format";
import { formatMoney, formatRecord, formatPoints, cn } from "@/lib/utils";
import { DraftCountdown } from "@/components/home/draft-countdown";
import { OwnerAvatar } from "@/components/home/owner-avatar";
import { HubEventsPopup } from "@/components/dashboard/hub-events-popup";
import { ScrollableTable } from "@/components/ui/scrollable-table";
import { DEFAULT_DRAFT_AT, type Matchup, type Standing } from "@/lib/types";

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
  const [
    league,
    { owner, isAdmin },
    matchupsData,
    dues,
    polls,
    trash,
    { events },
  ] = await Promise.all([
    getLeagueSettings(),
    getSessionContext(),
    getMatchupsData(),
    getDuesData(),
    getPollsData(),
    getTrashTalkData(),
    getLeagueEvents({ upcomingOnly: true }),
  ]);

  const paidCount = dues.payments.filter(
    (p) => p.amount_paid >= p.amount_due && p.amount_due > 0
  ).length;
  const collected = dues.payments.reduce((s, p) => s + p.amount_paid, 0);

  const tiles = TILES.filter((t) => !t.adminOnly || isAdmin);

  const currentWeek = matchupsData.week;
  const weekMatchups =
    currentWeek != null
      ? matchupsData.matchups.filter((m) => m.week === currentWeek)
      : [];

  // Pin the viewer's matchup first when linked
  const orderedWeekMatchups = orderWeekMatchups(weekMatchups, owner?.id);

  const standingByOwner = new Map(
    matchupsData.standings.map((s) => [s.owner_id, s] as const)
  );

  const myDues = owner
    ? dues.payments.find((p) => p.owner_id === owner.id)
    : null;
  const myDuesPaid =
    myDues != null &&
    myDues.amount_due > 0 &&
    myDues.amount_paid >= myDues.amount_due;

  const lastSync = league.last_sleeper_sync_at
    ? new Date(league.last_sleeper_sync_at)
    : null;
  const lastSyncLabel =
    lastSync && !Number.isNaN(lastSync.getTime())
      ? lastSync.toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      : null;

  const popupEvents = events;

  return (
    <div className="space-y-8">
      <HubEventsPopup events={popupEvents} />

      <DraftCountdown draftAt={league.draft_at || DEFAULT_DRAFT_AT} compact />

      {/* THIS WEEK */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="ff-ribbon text-[10px] !px-3 !py-1">
              {currentWeek != null ? `Week ${currentWeek}` : "Season"}
            </p>
            <h2 className="ff-display mt-2 text-xl tracking-tight">
              THIS WEEK
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

        {orderedWeekMatchups.length === 0 ? (
          <div className="ff-card border-dashed p-5 text-sm text-muted-foreground">
            Matchups appear after Sleeper posts Week 1.
            {lastSyncLabel ? ` Last sync: ${lastSyncLabel}` : ""}
          </div>
        ) : (
          <div className="space-y-3">
            {orderedWeekMatchups.map((m) => {
              const isMine =
                owner != null &&
                (m.home_owner_id === owner.id || m.away_owner_id === owner.id);
              return (
                <WeekMatchupCard
                  key={m.id}
                  matchup={m}
                  standingByOwner={standingByOwner}
                  highlight={Boolean(isMine)}
                  yoursLabel={isMine}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Current season standings */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="ff-ribbon text-[10px] !px-3 !py-1">
              Season {matchupsData.season}
            </p>
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
        <ScrollableTable minWidth="28rem" hint="Swipe for PF / PA">
          <table className="w-full text-sm">
            <thead className="border-b-2 border-foreground bg-[#f4f2ef] text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="ff-sticky-rank px-3 py-3 sm:px-4">#</th>
                <th className="ff-sticky-team px-3 py-3 sm:px-4">Owner</th>
                <th className="px-3 py-3 text-right sm:px-4">W-L-T</th>
                <th className="px-3 py-3 text-right sm:px-4">PF</th>
                <th className="px-3 py-3 text-right sm:px-4">PA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {matchupsData.standings.map((row) => {
                const name =
                  row.owner?.team_name ||
                  row.owner?.display_name ||
                  "—";
                const displayName = row.owner?.display_name ?? name;
                const isMe = owner && row.owner_id === owner.id;
                return (
                  <tr
                    key={row.id}
                    className={cn(isMe && "bg-amber-50/80")}
                  >
                    <td className="ff-sticky-rank px-3 py-2.5 font-mono font-bold tabular-nums sm:px-4">
                      {row.rank}
                    </td>
                    <td className="ff-sticky-team px-3 py-2.5 sm:px-4">
                      <div className="flex min-w-0 items-center gap-2">
                        {row.owner && (
                          <OwnerAvatar
                            name={displayName}
                            src={row.owner.avatar_url}
                            size="sm"
                          />
                        )}
                        <div className="min-w-0">
                          <p
                            className={cn(
                              "ff-display truncate text-sm",
                              isMe && "font-bold"
                            )}
                          >
                            {displayName}
                            {isMe ? " · you" : ""}
                          </p>
                          {row.owner?.team_name &&
                            row.owner.team_name !== displayName && (
                              <p className="truncate text-[10px] text-muted-foreground">
                                {row.owner.team_name}
                              </p>
                            )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs font-bold tabular-nums sm:px-4">
                      {formatRecord(row.wins, row.losses, row.ties)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums text-muted-foreground sm:px-4">
                      {formatPoints(row.points_for)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums text-muted-foreground sm:px-4">
                      {formatPoints(row.points_against)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ScrollableTable>
        <p className="text-[11px] text-muted-foreground">
          Current season only · all-time franchise table lives on{" "}
          <Link href="/history" className="font-semibold underline">
            History
          </Link>
          .
        </p>
      </section>

      {/* Events */}
      <section className="space-y-3">
        <div>
          <p className="ff-ribbon text-[10px] !px-3 !py-1">Calendar</p>
          <h2 className="ff-display mt-2 text-xl tracking-tight">
            Upcoming events
          </h2>
        </div>
        {events.length === 0 ? (
          <div className="ff-card border-dashed p-5 text-sm text-muted-foreground">
            No upcoming events.{" "}
            {isAdmin ? (
              <>
                Add one in{" "}
                <Link href="/admin/events" className="font-semibold underline">
                  Admin → Events
                </Link>
                .
              </>
            ) : (
              "Check back later."
            )}
          </div>
        ) : (
          <ul className="space-y-3">
            {events.map((ev) => (
              <li key={ev.id} className="ff-card overflow-hidden">
                <div className="ff-top-stripe" />
                <div className="px-4 py-4 sm:px-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    {ev.kind || "event"}
                  </p>
                  <p className="ff-display mt-1 text-lg tracking-wide">
                    {ev.title}
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {formatEventWhenEt(ev.starts_at)}
                  </p>
                  {ev.location && (
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {ev.location}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Status chips */}
      <section className="space-y-3">
        <div>
          <p className="ff-ribbon text-[10px] !px-3 !py-1">Quick looks</p>
          <h2 className="ff-display mt-2 text-xl tracking-tight">Status</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
          {lastSyncLabel && (
            <HubStat
              label="Last Sleeper sync"
              value={lastSyncLabel}
              href={isAdmin ? "/admin/sleeper" : undefined}
            />
          )}
        </div>
      </section>

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

function orderWeekMatchups(
  matchups: Matchup[],
  ownerId: string | undefined
): Matchup[] {
  if (!ownerId) return matchups;
  const mine: Matchup[] = [];
  const rest: Matchup[] = [];
  for (const m of matchups) {
    if (m.home_owner_id === ownerId || m.away_owner_id === ownerId) {
      mine.push(m);
    } else {
      rest.push(m);
    }
  }
  return [...mine, ...rest];
}

function WeekMatchupCard({
  matchup,
  standingByOwner,
  highlight,
  yoursLabel,
}: {
  matchup: Matchup;
  standingByOwner: Map<string, Standing>;
  highlight?: boolean;
  yoursLabel?: boolean;
}) {
  const home = matchup.home_owner;
  const away = matchup.away_owner;
  const homeStanding = standingByOwner.get(matchup.home_owner_id);
  const awayStanding = standingByOwner.get(matchup.away_owner_id);
  const homeScore = matchup.home_score ?? 0;
  const awayScore = matchup.away_score ?? 0;
  const homeRec = homeStanding
    ? formatRecord(homeStanding.wins, homeStanding.losses, homeStanding.ties)
    : "0-0";
  const awayRec = awayStanding
    ? formatRecord(awayStanding.wins, awayStanding.losses, awayStanding.ties)
    : "0-0";

  return (
    <article
      className={cn(
        "ff-card overflow-hidden p-4 sm:p-5",
        highlight && "ring-2 ring-[var(--accent-gold)] ring-offset-2"
      )}
    >
      {yoursLabel && (
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-800">
          Your matchup
        </p>
      )}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex min-w-0 items-center justify-end gap-2 text-right">
          <div className="min-w-0">
            <p className="ff-display truncate text-sm">
              {home?.display_name ?? "TBD"}
            </p>
            <p className="font-mono text-[10px] font-bold tabular-nums text-muted-foreground">
              {homeRec}
            </p>
            <p className="mt-1 font-mono text-xl font-bold tabular-nums">
              {homeScore.toFixed(1)}
            </p>
          </div>
          {home && (
            <OwnerAvatar
              name={home.display_name}
              src={home.avatar_url}
              size="sm"
            />
          )}
        </div>
        <div className="text-center">
          <p className="ff-display text-xs text-muted-foreground">
            {matchup.is_complete ? "final" : "vs"}
          </p>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          {away && (
            <OwnerAvatar
              name={away.display_name}
              src={away.avatar_url}
              size="sm"
            />
          )}
          <div className="min-w-0">
            <p className="ff-display truncate text-sm">
              {away?.display_name ?? "TBD"}
            </p>
            <p className="font-mono text-[10px] font-bold tabular-nums text-muted-foreground">
              {awayRec}
            </p>
            <p className="mt-1 font-mono text-xl font-bold tabular-nums">
              {awayScore.toFixed(1)}
            </p>
          </div>
        </div>
      </div>
    </article>
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
      <Link
        href={href}
        className="ff-stat-card block transition-opacity hover:opacity-90"
      >
        {inner}
      </Link>
    );
  }
  return <div className="ff-stat-card">{inner}</div>;
}
