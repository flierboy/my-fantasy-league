"use client";

import { useEffect, useState } from "react";
import type { LeagueEvent } from "@/lib/types";
import { formatEventWhen } from "@/lib/data/events-format";

function todayKey(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function dismissStorageKey(eventId: string): string {
  return `ud-event-dismiss:${eventId}:${todayKey()}`;
}

/**
 * Once per calendar day: soonest commissioner / league event in the next 14 days.
 * NFL games are on the Hub scoreboard card — not modaled.
 */
export function HubEventsPopup({ events }: { events: LeagueEvent[] }) {
  const [open, setOpen] = useState(false);
  const [event, setEvent] = useState<LeagueEvent | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!events.length) return;

    const now = Date.now();
    const horizon = now + 14 * 24 * 60 * 60 * 1000;
    const upcoming = [...events]
      .filter((e) => {
        if (e.kind === "nfl") return false;
        const t = new Date(e.starts_at).getTime();
        return Number.isFinite(t) && t >= now && t <= horizon;
      })
      .sort(
        (a, b) =>
          new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
      );

    const candidate = upcoming[0];
    if (!candidate) return;

    try {
      if (localStorage.getItem(dismissStorageKey(candidate.id))) return;
    } catch {
      /* private mode */
    }

    setEvent(candidate);
    setOpen(true);
  }, [events]);

  function dismiss() {
    if (event) {
      try {
        localStorage.setItem(dismissStorageKey(event.id), "1");
      } catch {
        /* ignore */
      }
    }
    setOpen(false);
  }

  if (!open || !event) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hub-event-popup-title"
      onClick={dismiss}
    >
      <div
        className="ff-card w-full max-w-md overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ff-top-stripe" />
        <div className="p-5 sm:p-6">
          <p className="ff-ribbon text-[10px] !px-3 !py-1">Coming up</p>
          <h2
            id="hub-event-popup-title"
            className="ff-display mt-3 text-2xl tracking-tight"
          >
            {event.title}
          </h2>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {formatEventWhen(event.starts_at, event.kind)}
          </p>
          {event.location && (
            <p className="mt-1 text-sm text-muted-foreground">{event.location}</p>
          )}
          <button
            type="button"
            onClick={dismiss}
            className="mt-5 w-full rounded-lg border-2 border-foreground bg-foreground px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-background transition-opacity hover:opacity-90"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
