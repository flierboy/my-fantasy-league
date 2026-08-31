import { getDuesData } from "@/lib/data/dashboard";
import { formatMoney } from "@/lib/utils";
import { OwnerAvatar } from "@/components/home/owner-avatar";
import { ScrollableTable } from "@/components/ui/scrollable-table";

export const metadata = {
  title: "Dues",
};

/** 2026 purse split (hardcoded until league_settings prize columns exist). */
const PURSE = {
  first: 2000,
  second: 500,
  third: 250,
} as const;

export default async function DuesPage() {
  const { league, payments, season } = await getDuesData();

  const duesAmount = league.dues_amount;
  const teamCount = payments.length || 10;
  const totalDue = payments.reduce((s, p) => s + p.amount_due, 0);
  const collected = payments.reduce((s, p) => s + p.amount_paid, 0);
  const paidCount = payments.filter(
    (p) => p.amount_paid >= p.amount_due && p.amount_due > 0
  ).length;
  const poolNote = `${teamCount} × ${formatMoney(duesAmount)} = ${formatMoney(teamCount * duesAmount)}`;

  // Sort: unpaid first, then by name
  const sorted = [...payments].sort((a, b) => {
    const aPaid = a.amount_paid >= a.amount_due ? 1 : 0;
    const bPaid = b.amount_paid >= b.amount_due ? 1 : 0;
    if (aPaid !== bPaid) return aPaid - bPaid;
    return (a.owner?.display_name ?? "").localeCompare(
      b.owner?.display_name ?? ""
    );
  });

  return (
    <div className="space-y-8">
      <header>
        <p className="ff-ribbon">Money</p>
        <h1 className="ff-display mt-2 text-3xl tracking-tight">
          Dues & prize money
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Season {season} · {formatMoney(duesAmount)} per team
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Dues / team" value={formatMoney(duesAmount)} />
        <StatCard label="Collected" value={formatMoney(collected)} />
        <StatCard
          label="Paid"
          value={`${paidCount}/${payments.length}`}
          sub={`${formatMoney(totalDue)} target`}
        />
      </div>

      {/* Purse / payout structure */}
      <section className="ff-card overflow-hidden">
        <div className="ff-top-stripe" />
        <div className="p-5 sm:p-6">
          <p className="ff-ribbon text-[10px] !px-3 !py-1">The purse</p>
          <h2 className="ff-display mt-2 text-xl tracking-tight">
            Prize structure
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{poolNote}</p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-3">
            <PursePlace place="1st" amount={PURSE.first} accent="gold" />
            <PursePlace place="2nd" amount={PURSE.second} />
            <PursePlace place="3rd" amount={PURSE.third} />
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            1st {formatMoney(PURSE.first)} · 2nd {formatMoney(PURSE.second)} ·
            3rd {formatMoney(PURSE.third)}
            {" · "}
            payouts from the dues pool.
          </p>
        </div>
      </section>

      <ScrollableTable minWidth="28rem" hint="Swipe for due · paid · status">
        <table className="w-full text-sm">
          <thead className="border-b-2 border-foreground bg-[#f4f2ef] text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3 text-right">Due</th>
              <th className="px-4 py-3 text-right">Paid</th>
              <th className="px-4 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((row) => {
              const name = row.owner?.display_name ?? "Unknown";
              const paid =
                row.amount_paid >= row.amount_due && row.amount_due > 0;
              const partial =
                row.amount_paid > 0 && row.amount_paid < row.amount_due;
              return (
                <tr key={row.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <OwnerAvatar name={name} size="sm" />
                      <span className="ff-display text-sm">{name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {formatMoney(row.amount_due)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {formatMoney(row.amount_paid)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={
                        paid
                          ? "inline-flex rounded-full border border-emerald-700 bg-emerald-100 px-2 py-0.5 text-[11px] font-bold uppercase text-emerald-800"
                          : partial
                            ? "inline-flex rounded-full border border-sky-700 bg-sky-100 px-2 py-0.5 text-[11px] font-bold uppercase text-sky-900"
                            : "inline-flex rounded-full border border-amber-700 bg-amber-100 px-2 py-0.5 text-[11px] font-bold uppercase text-amber-900"
                      }
                    >
                      {paid ? "Paid" : partial ? "Partial" : "Owes"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </ScrollableTable>

      <p className="text-xs text-muted-foreground">
        Commissioners track who has paid. Reach out if your balance looks off.
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border-2 border-foreground bg-white p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="ff-display mt-1 text-lg tabular-nums sm:text-2xl">{value}</p>
      {sub && (
        <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
      )}
    </div>
  );
}

function PursePlace({
  place,
  amount,
  accent,
}: {
  place: string;
  amount: number;
  accent?: "gold";
}) {
  return (
    <li
      className={
        accent === "gold"
          ? "rounded-lg border-2 border-[var(--accent-gold)] bg-amber-50/80 px-4 py-3"
          : "rounded-lg border-2 border-border bg-[#f4f2ef] px-4 py-3"
      }
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {place}
      </p>
      <p className="ff-display mt-1 text-2xl tabular-nums">
        {formatMoney(amount)}
      </p>
    </li>
  );
}
