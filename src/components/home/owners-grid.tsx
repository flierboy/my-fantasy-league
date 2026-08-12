import type { Owner } from "@/lib/types";
import { formatRecord } from "@/lib/utils";
import { OwnerAvatar } from "./owner-avatar";
import { OwnerBadge } from "./owner-badge";
import { MoneyChip } from "./money-chip";

interface OwnersGridProps {
  owners: Owner[];
}

export function OwnersGrid({ owners }: OwnersGridProps) {
  const sorted = [...owners].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <section>
      <div className="mb-5 text-center sm:mb-6 sm:text-left">
        <p className="ff-ribbon">The league</p>
        <h2 className="ff-display mt-2.5 text-2xl tracking-tight sm:text-3xl">
          Owners
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Franchise all-time W-L, prize money, and badges
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-3.5 lg:grid-cols-5">
        {sorted.map((owner) => (
          <article
            key={owner.id}
            className="ff-player-card flex flex-col items-center p-3.5 text-center sm:p-4"
          >
            <OwnerAvatar
              name={owner.display_name}
              src={owner.avatar_url}
              size="lg"
            />
            <p className="ff-display mt-3 text-sm tracking-wide sm:text-base">
              {owner.display_name}
            </p>
            {owner.team_name && (
              <p className="mt-0.5 max-w-full truncate px-1 text-[11px] font-semibold text-muted-foreground">
                {owner.team_name}
              </p>
            )}
            <p className="mt-1.5 font-mono text-sm font-bold tabular-nums">
              {formatRecord(owner.wins, owner.losses, owner.ties)}
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Franchise all-time
            </p>

            <div className="mt-2.5">
              <MoneyChip amount={owner.prize_money} />
            </div>

            {owner.badges.length > 0 && (
              <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5">
                {owner.badges.map((key) => (
                  <OwnerBadge key={key} badgeKey={key} />
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
