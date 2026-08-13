"use client";

import { useState } from "react";
import type { Owner } from "@/lib/types";
import { PlayerCard, PlayerListRow } from "./player-card";
import { cn } from "@/lib/utils";

interface PlayersViewProps {
  owners: Owner[];
  /** Show section header (homepage) */
  showHeader?: boolean;
  defaultView?: "grid" | "list";
}

/**
 * Grid / list toggle for public Players roster.
 */
export function PlayersView({
  owners,
  showHeader = true,
  defaultView = "grid",
}: PlayersViewProps) {
  const [view, setView] = useState<"grid" | "list">(defaultView);
  const sorted = [...owners].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <section>
      <div
        className={cn(
          "mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between"
        )}
      >
        {showHeader ? (
          <div className="text-center sm:text-left">
            <p className="ff-ribbon">The league</p>
            <h2 className="ff-display mt-2.5 text-2xl tracking-tight sm:text-3xl">
              Players
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Franchise cards · cash · badges · all-time W-L
            </p>
          </div>
        ) : (
          <div />
        )}

        <div className="flex justify-center gap-1 self-center rounded-xl border-2 border-foreground bg-white p-1 shadow-[2px_2px_0_0_#141414] sm:self-auto">
          <ViewButton
            active={view === "grid"}
            onClick={() => setView("grid")}
            label="Grid"
          />
          <ViewButton
            active={view === "list"}
            onClick={() => setView("list")}
            label="List"
          />
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="ff-card p-8 text-center text-sm text-muted-foreground">
          No owners yet. Admins can add them under Admin → Owners, or sync from
          Sleeper.
        </p>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {sorted.map((owner) => (
            <PlayerCard key={owner.id} owner={owner} />
          ))}
        </div>
      ) : (
        <ol className="ff-card divide-y-2 divide-border overflow-hidden">
          {sorted.map((owner) => (
            <PlayerListRow key={owner.id} owner={owner} />
          ))}
        </ol>
      )}
    </section>
  );
}

function ViewButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] transition-colors",
        active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}
