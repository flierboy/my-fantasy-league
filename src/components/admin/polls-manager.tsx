"use client";

import type { Poll, PollVote } from "@/lib/types";
import {
  createPoll,
  setPollActive,
  deletePoll,
} from "@/lib/actions/admin/polls";
import { ActionForm } from "./action-form";
import { SubmitButton } from "./submit-button";
import { Field, fieldInputClass, fieldTextareaClass } from "./field";

export function PollsManager({
  polls,
  votes,
}: {
  polls: Poll[];
  votes: PollVote[];
}) {
  return (
    <div className="space-y-8">
      <section className="rounded-xl border-2 border-foreground bg-white p-5 shadow-sm sm:p-6">
        <h2 className="ff-display text-xl">Create poll</h2>
        <ActionForm action={createPoll} className="mt-4">
          <Field label="Title" htmlFor="title">
            <input
              id="title"
              name="title"
              required
              className={fieldInputClass}
              placeholder="Draft day snacks?"
            />
          </Field>
          <Field label="Description" htmlFor="description">
            <input
              id="description"
              name="description"
              className={fieldInputClass}
              placeholder="Optional"
            />
          </Field>
          <Field
            label="Options (one per line)"
            htmlFor="options"
            hint="At least two options"
          >
            <textarea
              id="options"
              name="options"
              required
              className={fieldTextareaClass}
              placeholder={"Beer\nPizza\nBoth"}
            />
          </Field>
          <label className="flex items-start gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              name="email_owners"
              value="on"
              defaultChecked
              className="mt-0.5 h-4 w-4 accent-foreground"
            />
            <span>
              Email all owners
              <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                Sends to every owner with an email on file (respects opt-out).
                Requires RESEND_API_KEY.
              </span>
            </span>
          </label>
          <SubmitButton>Create poll</SubmitButton>
        </ActionForm>
      </section>

      <section className="space-y-4">
        <h2 className="ff-display text-xl">Existing polls</h2>
        {polls.length === 0 && (
          <p className="text-sm text-muted-foreground">No polls yet.</p>
        )}
        {polls.map((poll) => {
          const pollVotes = votes.filter((v) => v.poll_id === poll.id);
          const total = pollVotes.length;
          return (
            <article
              key={poll.id}
              className="rounded-xl border-2 border-foreground bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="ff-display text-lg">{poll.title}</h3>
                  {poll.description && (
                    <p className="text-sm text-muted-foreground">
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

              <ul className="mt-4 space-y-2">
                {poll.options.map((opt, idx) => {
                  const count = pollVotes.filter(
                    (v) => v.option_index === idx
                  ).length;
                  const pct =
                    total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <li key={idx} className="text-sm">
                      <div className="mb-1 flex justify-between font-semibold">
                        <span>{opt}</span>
                        <span className="font-mono text-muted-foreground">
                          {count} · {pct}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-foreground"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">
                {total} total vote{total === 1 ? "" : "s"}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <ActionForm action={setPollActive} className="!space-y-0">
                  <input type="hidden" name="id" value={poll.id} />
                  <input
                    type="hidden"
                    name="is_active"
                    value={poll.is_active ? "false" : "true"}
                  />
                  <SubmitButton variant="outline">
                    {poll.is_active ? "Close poll" : "Open poll"}
                  </SubmitButton>
                </ActionForm>
                <ActionForm action={deletePoll} className="!space-y-0">
                  <input type="hidden" name="id" value={poll.id} />
                  <SubmitButton variant="outline">Delete</SubmitButton>
                </ActionForm>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
