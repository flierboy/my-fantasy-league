import Link from "next/link";
import { OwnerAvatar } from "@/components/home/owner-avatar";
import { ScrollableTable } from "@/components/ui/scrollable-table";
import { cn, formatPoints, formatRecord, formatWinPct } from "@/lib/utils";

export type HistoryStandingRow = {
  id: string;
  rank: number;
  name: string;
  ownerId?: string | null;
  avatarUrl?: string | null;
  teamName?: string | null;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number | null | undefined;
  pointsAgainst: number | null | undefined;
  highlight?: "champ" | "runner" | null;
};

/**
 * History standings: stacked stat cards below sm (no swipe),
 * full table from sm and up.
 */
export function HistoryStandingsResponsive({
  rows,
  className,
}: {
  rows: HistoryStandingRow[];
  className?: string;
}) {
  return (
    <div className={cn(className)}>
      {/* Mobile — all stats visible, no horizontal scroll */}
      <ul className="space-y-2 sm:hidden">
        {rows.map((row) => (
          <li
            key={row.id}
            className={cn(
              "ff-card px-3 py-3",
              row.highlight === "champ" && "bg-amber-50/90",
              row.highlight === "runner" && "bg-zinc-50"
            )}
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 shrink-0 font-mono text-sm font-bold tabular-nums text-muted-foreground">
                {row.rank}
                {row.highlight === "champ" ? " 🏆" : ""}
                {row.highlight === "runner" ? " 🥈" : ""}
              </span>
              <OwnerAvatar
                name={row.name}
                src={row.avatarUrl}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                {row.ownerId ? (
                  <Link
                    href={`/players/${row.ownerId}`}
                    className="ff-display block truncate text-sm hover:underline"
                  >
                    {row.name}
                  </Link>
                ) : (
                  <p className="ff-display truncate text-sm">{row.name}</p>
                )}
                {row.teamName && row.teamName !== row.name && (
                  <p className="truncate text-[11px] text-muted-foreground">
                    {row.teamName}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-2.5 grid grid-cols-4 gap-1.5 border-t border-border/70 pt-2.5">
              <StatCell label="W-L-T" value={formatRecord(row.wins, row.losses, row.ties)} bold />
              <StatCell label="Win%" value={formatWinPct(row.wins, row.losses, row.ties)} />
              <StatCell label="PF" value={formatPoints(row.pointsFor)} />
              <StatCell label="PA" value={formatPoints(row.pointsAgainst)} muted />
            </div>
          </li>
        ))}
      </ul>

      {/* sm+ — existing table */}
      <div className="hidden sm:block">
        <ScrollableTable
          minWidth="32rem"
          showHint={false}
        >
          <table className="w-full text-sm">
            <thead className="border-b-2 border-foreground bg-[#f4f2ef] text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="ff-sticky-rank px-3 py-3 sm:px-4">#</th>
                <th className="ff-sticky-team px-3 py-3 sm:px-4">Owner</th>
                <th className="px-3 py-3 text-right sm:px-4">W-L-T</th>
                <th className="px-3 py-3 text-right sm:px-4">Win%</th>
                <th className="px-3 py-3 text-right sm:px-4">PF</th>
                <th className="px-3 py-3 text-right sm:px-4">PA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className={
                    row.highlight === "champ"
                      ? "bg-amber-50/90"
                      : row.highlight === "runner"
                        ? "bg-zinc-50"
                        : undefined
                  }
                >
                  <td className="ff-sticky-rank px-3 py-3 font-mono font-bold sm:px-4">
                    {row.rank}
                    {row.highlight === "champ" ? " 🏆" : ""}
                    {row.highlight === "runner" ? " 🥈" : ""}
                  </td>
                  <td className="ff-sticky-team px-3 py-3 sm:px-4">
                    <div className="flex items-center gap-2">
                      <OwnerAvatar
                        name={row.name}
                        src={row.avatarUrl}
                        size="sm"
                      />
                      <div className="min-w-0">
                        {row.ownerId ? (
                          <Link
                            href={`/players/${row.ownerId}`}
                            className="ff-display text-sm hover:underline"
                          >
                            {row.name}
                          </Link>
                        ) : (
                          <span className="ff-display text-sm">{row.name}</span>
                        )}
                        {row.teamName && row.teamName !== row.name && (
                          <p className="truncate text-[11px] text-muted-foreground">
                            {row.teamName}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-bold tabular-nums sm:px-4">
                    {formatRecord(row.wins, row.losses, row.ties)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono tabular-nums sm:px-4">
                    {formatWinPct(row.wins, row.losses, row.ties)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono tabular-nums sm:px-4">
                    {formatPoints(row.pointsFor)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono tabular-nums text-muted-foreground sm:px-4">
                    {formatPoints(row.pointsAgainst)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollableTable>
      </div>
    </div>
  );
}

function StatCell({
  label,
  value,
  bold,
  muted,
}: {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="min-w-0 text-center">
      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 truncate font-mono text-xs tabular-nums",
          bold && "font-bold",
          muted && "text-muted-foreground"
        )}
      >
        {value}
      </p>
    </div>
  );
}
