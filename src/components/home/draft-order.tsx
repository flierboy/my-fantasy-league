import type { Owner } from "@/lib/types";
import { formatRecord } from "@/lib/utils";
import { OwnerAvatar } from "./owner-avatar";
import { OwnerBadge } from "./owner-badge";
import { MoneyChip } from "./money-chip";

interface DraftOrderProps {
  owners: Owner[];
}

export function DraftOrder({ owners }: DraftOrderProps) {
  const ordered = [...owners]
    .filter((o) => o.draft_slot != null)
    .sort((a, b) => (a.draft_slot ?? 99) - (b.draft_slot ?? 99));

  return (
    <section>
      <div className="mb-4 text-center sm:text-left">
        <p className="ff-ribbon">Draft</p>
        <h2 className="ff-display mt-2 text-2xl tracking-tight sm:text-3xl">
          Draft order
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Current snake order</p>
      </div>

      <ol className="overflow-hidden rounded-xl border-2 border-foreground bg-white shadow-sm divide-y-2 divide-border">
        {ordered.map((owner) => (
          <li
            key={owner.id}
            className="flex items-center gap-3 px-3 py-3 sm:gap-4 sm:px-5 sm:py-3.5"
          >
            {/* Pick number */}
            <span className="ff-display flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-foreground bg-[#f4f2ef] text-sm sm:h-10 sm:w-10 sm:text-base">
              {owner.draft_slot}
            </span>

            <OwnerAvatar
              name={owner.display_name}
              src={owner.avatar_url}
              size="sm"
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="ff-display text-sm tracking-wide sm:text-base">
                  {owner.display_name}
                </p>
                {owner.badges.map((key) => (
                  <OwnerBadge key={key} badgeKey={key} />
                ))}
              </div>
              <p className="mt-0.5 font-mono text-xs font-semibold tabular-nums text-muted-foreground">
                {formatRecord(owner.wins, owner.losses, owner.ties)}
              </p>
            </div>

            <MoneyChip
              amount={owner.prize_money}
              className="hidden shrink-0 sm:inline-flex"
            />
          </li>
        ))}
      </ol>
    </section>
  );
}
