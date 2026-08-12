import Link from "next/link";
import {
  getAdminData,
  getDuesData,
  getMatchupsData,
  getPollsData,
  getTrashTalkData,
} from "@/lib/data/dashboard";
import { getSessionContext } from "@/lib/auth/session";
import { formatMoney } from "@/lib/utils";

export const metadata = {
  title: "Admin",
};

const SECTIONS = [
  {
    href: "/admin/owners",
    icon: "👥",
    title: "Owners",
    blurb: "Records, badges, draft, logins",
  },
  {
    href: "/admin/settings",
    icon: "🏈",
    title: "Settings",
    blurb: "Name, rules, season, dues amount",
  },
  {
    href: "/admin/matchups",
    icon: "📅",
    title: "Matchups",
    blurb: "Weekly scores & standings",
  },
  {
    href: "/admin/dues",
    icon: "💵",
    title: "Dues",
    blurb: "Paid / unpaid tracker",
  },
  {
    href: "/admin/polls",
    icon: "📊",
    title: "Polls",
    blurb: "Create, close, results",
  },
  {
    href: "/admin/trash-talk",
    icon: "🛡️",
    title: "Moderation",
    blurb: "Delete trash talk posts",
  },
];

export default async function AdminHomePage() {
  const [{ league, owners }, { owner }, matchups, dues, polls, trash] =
    await Promise.all([
      getAdminData(),
      getSessionContext(),
      getMatchupsData(),
      getDuesData(),
      getPollsData(),
      getTrashTalkData(),
    ]);

  const paid = dues.payments.filter(
    (p) => p.amount_paid >= p.amount_due && p.amount_due > 0
  ).length;
  const linked = owners.filter((o) => o.user_id).length;

  return (
    <div className="space-y-8">
      <header>
        <p className="ff-ribbon">Commissioner tools</p>
        <h1 className="ff-display mt-2 text-3xl tracking-tight">Admin</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Manage {league.name} without leaving the site
          {owner ? ` · signed in as ${owner.display_name}` : ""}.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Owners" value={`${owners.length}`} sub={`${linked} linked`} />
        <Stat
          label="Matchups"
          value={String(matchups.matchups.length)}
          sub={matchups.week != null ? `Week ${matchups.week}` : "No weeks yet"}
        />
        <Stat
          label="Dues"
          value={`${paid}/${dues.payments.length}`}
          sub={formatMoney(
            dues.payments.reduce((s, p) => s + p.amount_paid, 0)
          )}
        />
        <Stat
          label="Activity"
          value={`${polls.polls.length} polls`}
          sub={`${trash.posts.length} posts`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {SECTIONS.map((s) => (
          <Link key={s.href} href={s.href} className="ff-hub-tile">
            <span className="text-2xl" aria-hidden>
              {s.icon}
            </span>
            <span>{s.title}</span>
            <span className="ff-hub-blurb">{s.blurb}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border-2 border-foreground bg-white p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="ff-display mt-1 text-2xl">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
