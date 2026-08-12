"use client";

import { useState, useTransition } from "react";
import { castPollVote } from "@/lib/actions/polls";
import type { Poll, PollVote } from "@/lib/types";
import { Button } from "@/components/ui/button";

interface PollCardProps {
  poll: Poll;
  votes: PollVote[];
  currentOwnerId: string | null;
  canVote: boolean;
}

export function PollCard({
  poll,
  votes,
  currentOwnerId,
  canVote,
}: PollCardProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const pollVotes = votes.filter((v) => v.poll_id === poll.id);
  const total = pollVotes.length || 0;
  const myVote = currentOwnerId
    ? pollVotes.find((v) => v.owner_id === currentOwnerId)
    : undefined;

  const counts = poll.options.map(
    (_, idx) => pollVotes.filter((v) => v.option_index === idx).length
  );

  function vote(optionIndex: number) {
    setError(null);
    startTransition(async () => {
      const result = await castPollVote(poll.id, optionIndex);
      if (!result.ok) {
        setError(result.error ?? "Vote failed");
      }
    });
  }

  return (
    <article className="rounded-xl border-2 border-foreground bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="ff-display text-lg">{poll.title}</h2>
          {poll.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {poll.description}
            </p>
          )}
        </div>
        <span
          className={
            poll.is_active
              ? "rounded-full border border-green-600 px-2 py-0.5 text-[10px] font-bold uppercase text-green-700"
              : "rounded-full border border-border px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground"
          }
        >
          {poll.is_active ? "Open" : "Closed"}
        </span>
      </div>

      <ul className="mt-4 space-y-3">
        {poll.options.map((opt, idx) => {
          const count = counts[idx] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const selected = myVote?.option_index === idx;

          return (
            <li key={`${poll.id}-${idx}`}>
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-semibold">
                  {opt}
                  {selected && (
                    <span className="ml-2 text-[10px] font-bold uppercase text-emerald-700">
                      your vote
                    </span>
                  )}
                </span>
                <span className="font-mono text-muted-foreground">
                  {count} · {pct}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-foreground transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              {canVote && poll.is_active && (
                <Button
                  type="button"
                  size="sm"
                  variant={selected ? "default" : "outline"}
                  className="mt-2"
                  disabled={pending}
                  onClick={() => vote(idx)}
                >
                  {selected ? "Voted" : "Vote"}
                </Button>
              )}
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-xs text-muted-foreground">
        {total} vote{total === 1 ? "" : "s"}
        {!canVote && poll.is_active && " · link your owner to vote"}
      </p>
      {error && (
        <p className="mt-2 text-sm font-medium text-destructive" role="alert">
          {error}
        </p>
      )}
    </article>
  );
}
