"use client";

import { useEffect, useState } from "react";
import { DEFAULT_DRAFT_AT } from "@/lib/types";

interface DraftCountdownProps {
  /** ISO datetime from league_settings.draft_at */
  draftAt?: string | null;
  /** Compact layout for tight spaces */
  compact?: boolean;
}

type Parts = { days: number; hours: number; minutes: number; seconds: number };

function getParts(targetMs: number, nowMs: number): Parts | null {
  const diff = targetMs - nowMs;
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

function formatDraftLabel(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/New_York",
      timeZoneName: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/**
 * Live countdown to the Upper Deckcers draft.
 * Target defaults to Sun Aug 30, 2026 3:45 PM EDT.
 */
export function DraftCountdown({
  draftAt,
  compact = false,
}: DraftCountdownProps) {
  const targetIso = draftAt?.trim() || DEFAULT_DRAFT_AT;
  const targetMs = new Date(targetIso).getTime();

  const [parts, setParts] = useState<Parts | null>(() =>
    getParts(targetMs, Date.now())
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const tick = () => setParts(getParts(targetMs, Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  const live = mounted ? parts : getParts(targetMs, targetMs - 1); // SSR placeholder
  const ended = mounted && parts === null;

  return (
    <section className="ff-card-stripe relative overflow-hidden">
      <div className="ff-top-stripe" />
      <div
        className={
          compact
            ? "px-4 py-5 sm:px-6 sm:py-5"
            : "px-5 py-6 sm:px-8 sm:py-8"
        }
      >
        <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
          <p className="ff-ribbon text-[10px] !px-3 !py-1">Draft day</p>
          <h2 className="ff-display mt-3 text-2xl tracking-tight sm:text-3xl">
            {ended ? "Draft is live" : "Countdown to draft"}
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {formatDraftLabel(targetIso)}
          </p>
        </div>

        {ended ? (
          <p className="ff-display mt-6 text-center text-xl text-foreground sm:text-left">
            Lock in. Good luck.
          </p>
        ) : (
          <div
            className={
              compact
                ? "mt-5 grid grid-cols-4 gap-2"
                : "mt-6 grid grid-cols-4 gap-2 sm:gap-3"
            }
          >
            <TimeBox label="Days" value={live?.days ?? 0} />
            <TimeBox label="Hours" value={live?.hours ?? 0} />
            <TimeBox label="Minutes" value={live?.minutes ?? 0} />
            <TimeBox label="Seconds" value={live?.seconds ?? 0} />
          </div>
        )}
      </div>
    </section>
  );
}

function TimeBox({ label, value }: { label: string; value: number }) {
  const display = String(value).padStart(2, "0");
  return (
    <div className="rounded-xl border-2 border-foreground bg-[#f4f2ef] px-2 py-3 text-center shadow-[2px_2px_0_0_#141414] sm:py-4">
      <p className="ff-display text-2xl tabular-nums tracking-tight sm:text-4xl">
        {display}
      </p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
