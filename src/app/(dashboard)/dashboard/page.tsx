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
    href: "/admin",
    icon: "⚙️",
    title: "Admin",
    blurb: "Records, draft, badges",
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

  const tiles = isAdmin
    ? TILES
    : TILES.filter((t) => t.href !== "/admin");

  return (
    <div>
      <div className="mb-8">
        <p className="ff-ribbon">Private</p>
        <h1 className="ff-display mt-2 text-3xl tracking-tight sm:text-4xl">
          League hub
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Welcome{owner ? `, ${owner.display_name}` : ""} — {league.name} ·{" "}
          {league.season_year}
        </p>
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tiles.map((tile) => (
          <Link key={tile.href} href={tile.href} className="ff-hub-tile">
            <span className="text-2xl" aria-hidden>
              {tile.icon}
            </span>
            <span>{tile.title}</span>
            <span className="ff-hub-blurb">{tile.blurb}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function HubStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border-2 border-foreground bg-white p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-mono text-sm font-bold tabular-nums sm:text-base">
        {value}
      </p>
    </div>
  );
}
