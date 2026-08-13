import Link from "next/link";
import type { Owner } from "@/lib/types";
import { formatRecord } from "@/lib/utils";
import { OwnerAvatar } from "./owner-avatar";
import { OwnerBadge } from "./owner-badge";
import { MoneyChip } from "./money-chip";
import { cn } from "@/lib/utils";

interface PlayerCardProps {
  owner: Owner;
  /** denser card for homepage strip */
  compact?: boolean;
  className?: string;
}

/**
 * Fake Football–style owner card: avatar, name, team, role, cash, badges.
 */
export function PlayerCard({
  owner,
  compact = false,
  className,
}: PlayerCardProps) {
  const role = owner.role;
  const href = `/players/${owner.id}`;

  return (
    <article
      className={cn(
        "ff-player-card flex flex-col items-center text-center",
        compact ? "p-3 sm:p-3.5" : "p-4 sm:p-5",
        className
      )}
    >
      <Link href={href} className="block">
        <OwnerAvatar
          name={owner.display_name}
          src={owner.avatar_url}
          size={compact ? "lg" : "xl"}
        />
      </Link>

      <Link
        href={href}
        className={cn(
          "ff-display mt-3 tracking-wide hover:underline",
          compact ? "text-sm sm:text-base" : "text-base sm:text-lg"
        )}
      >
        {owner.display_name}
      </Link>

      {owner.team_name && (
        <p className="mt-0.5 max-w-full truncate px-1 text-[11px] font-semibold leading-snug text-muted-foreground sm:text-xs">
          {owner.team_name}
        </p>
      )}

      {role && (
        <span className="mt-2 inline-flex items-center rounded-full border-2 border-foreground bg-[var(--banner)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white shadow-sm">
          {role}
        </span>
      )}

      {owner.favorite_nfl_team && (
        <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          NFL · {owner.favorite_nfl_team}
        </p>
      )}

      <p className="mt-2 font-mono text-sm font-bold tabular-nums">
        {formatRecord(owner.wins, owner.losses, owner.ties)}
      </p>
      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
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
  );
}

/** Horizontal roster row for list view */
export function PlayerListRow({ owner }: { owner: Owner }) {
  const href = `/players/${owner.id}`;
  return (
    <li className="flex items-center gap-3 px-3 py-3 sm:gap-4 sm:px-5 sm:py-3.5">
      <Link href={href}>
        <OwnerAvatar
          name={owner.display_name}
          src={owner.avatar_url}
          size="md"
        />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={href}
            className="ff-display text-sm tracking-wide hover:underline sm:text-base"
          >
            {owner.display_name}
          </Link>
          {owner.role && (
            <span className="rounded-full border border-foreground bg-[var(--banner)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
              {owner.role}
            </span>
          )}
          {owner.badges.map((key) => (
            <OwnerBadge key={key} badgeKey={key} />
          ))}
        </div>
        <p className="mt-0.5 truncate text-xs font-semibold text-muted-foreground">
          {owner.team_name || "—"}
          {owner.favorite_nfl_team ? ` · ${owner.favorite_nfl_team}` : ""}
          {" · "}
          <span className="font-mono tabular-nums">
            {formatRecord(owner.wins, owner.losses, owner.ties)}
          </span>
        </p>
      </div>
      <MoneyChip amount={owner.prize_money} className="shrink-0" />
    </li>
  );
}
