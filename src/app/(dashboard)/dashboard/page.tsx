import Link from "next/link";
import { getLeagueSettings } from "@/lib/data/league";
import { getSessionContext } from "@/lib/auth/session";
import {
  getMatchupsData,
  getDuesData,
  getPollsData,
  getTrashTalkData,
} from "@/lib/data/dashboard";
import { formatMoney } from "@/lib/utils";
import { DraftCountdown } from "@/components/home/draft-countdown";

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
    href: "/",
    icon: "👥",
    title: "Owners",
    blurb: "Public roster & draft order",
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
  const [league, { owner, isAdmin }, matchups, dues, polls, trash] =
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
          <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            {league.rules_summary}
          </p>
        </div>
      </section>

      <DraftCountdown draftAt={league.draft_at} compact />

      <div className="grid gap-3 sm:grid-cols-3">
        <HubStat
          label="Matchups"
          value={
            matchups.matchups.length
              ? `Week ${matchups.week ?? "—"} · ${matchups.matchups.length}`
              : "None yet"
          }
        />
        <HubStat
          label="Dues collected"
          value={`${formatMoney(collected)} · ${paidCount}/${dues.payments.length}`}
        />
        <HubStat
          label="Activity"
          value={`${polls.polls.length} polls · ${trash.posts.length} posts`}
        />
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

function HubStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="ff-stat-card">
      <p className="pl-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="ff-display mt-1.5 pl-1 text-lg tracking-wide tabular-nums sm:text-xl">
        {value}
      </p>
    </div>
  );
}
