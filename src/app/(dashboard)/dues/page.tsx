import { getDuesData } from "@/lib/data/dashboard";
import { formatMoney } from "@/lib/utils";
import { OwnerAvatar } from "@/components/home/owner-avatar";
import { ScrollableTable } from "@/components/ui/scrollable-table";

export const metadata = {
  title: "Dues",
};

export default async function DuesPage() {
  const { league, payments, season } = await getDuesData();

  const totalDue = payments.reduce((s, p) => s + p.amount_due, 0);
  const collected = payments.reduce((s, p) => s + p.amount_paid, 0);
  const paidCount = payments.filter(
    (p) => p.amount_paid >= p.amount_due && p.amount_due > 0
  ).length;

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
          Season {season} · {formatMoney(league.dues_amount)} per team
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Dues amount" value={formatMoney(league.dues_amount)} />
        <StatCard label="Collected" value={formatMoney(collected)} />
        <StatCard
          label="Prize pool target"
          value={`${formatMoney(totalDue)} · ${paidCount}/${payments.length} paid`}
        />
      </div>

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
              const paid = row.amount_paid >= row.amount_due && row.amount_due > 0;
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border-2 border-foreground bg-white p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="ff-display mt-1 text-lg tabular-nums sm:text-2xl">{value}</p>
    </div>
  );
}
