"use client";

import type { LeagueEvent } from "@/lib/types";
import { DEFAULT_DRAFT_AT } from "@/lib/types";
import {
  createLeagueEvent,
  updateLeagueEvent,
  deleteLeagueEvent,
} from "@/lib/actions/admin/events";
import { ActionForm } from "./action-form";
import { SubmitButton } from "./submit-button";
import { Field, fieldInputClass } from "./field";

/** Convert ISO → value for datetime-local (local browser TZ). */
function toDatetimeLocalValue(iso: string | null): string {
  const d = new Date(iso || DEFAULT_DRAFT_AT);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventsManager({
  events,
  error,
}: {
  events: LeagueEvent[];
  error?: string;
}) {
  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg border-2 border-destructive/40 bg-red-50 p-4 text-sm text-red-950">
          <p className="font-bold">Database error</p>
          <p className="mt-1 font-mono text-xs">{error}</p>
          <p className="mt-2 text-xs">
            Run{" "}
            <code className="font-mono">supabase/migrate-league-events.sql</code>
            .
          </p>
        </div>
      )}

      <section className="ff-card p-5 sm:p-6">
        <h2 className="ff-display text-xl">Add event</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Shows on Hub under League events. Signed-in owners get a once-per-day
          popup for the next non-NFL event. The weekly NFL board is live from
          ESPN (not stored here). Optional kind{" "}
          <code className="font-mono text-xs">nfl</code> with title{" "}
          <code className="font-mono text-xs">NE @ SEA</code> is only a fallback
          if ESPN fails.
        </p>
        <ActionForm action={createLeagueEvent} className="mt-4">
          <EventFields />
          <SubmitButton>Add event</SubmitButton>
        </ActionForm>
      </section>

      <section className="space-y-4">
        <h2 className="ff-display text-xl">Scheduled ({events.length})</h2>
        {events.length === 0 && (
          <p className="ff-card p-6 text-sm text-muted-foreground">
            No events yet. Run the migration to seed UFD Draft, or add one
            above.
          </p>
        )}
        {events.map((ev) => (
          <article key={ev.id} className="ff-card p-4 sm:p-5">
            <p className="mb-3 text-sm font-semibold text-muted-foreground">
              {ev.title} · {new Date(ev.starts_at).toLocaleString()}
            </p>
            <ActionForm action={updateLeagueEvent}>
              <input type="hidden" name="id" value={ev.id} />
              <EventFields event={ev} />
              <SubmitButton>Save</SubmitButton>
            </ActionForm>
            <ActionForm
              action={deleteLeagueEvent}
              className="mt-3 border-t border-border pt-3"
            >
              <input type="hidden" name="id" value={ev.id} />
              <SubmitButton variant="outline">Delete</SubmitButton>
            </ActionForm>
          </article>
        ))}
      </section>
    </div>
  );
}

function EventFields({ event }: { event?: LeagueEvent }) {
  const fid = event?.id ?? "new";
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Title" htmlFor={`${fid}-title`} className="sm:col-span-2">
        <input
          id={`${fid}-title`}
          name="title"
          required
          defaultValue={event?.title ?? ""}
          className={fieldInputClass}
          placeholder="UFD Draft"
        />
      </Field>
      <Field label="Starts at" htmlFor={`${fid}-starts`}>
        <input
          id={`${fid}-starts`}
          name="starts_at"
          type="datetime-local"
          required
          defaultValue={toDatetimeLocalValue(event?.starts_at ?? null)}
          className={fieldInputClass}
        />
      </Field>
      <Field
        label="Kind"
        htmlFor={`${fid}-kind`}
        hint="event · draft · meetup · nfl (primetime fallback)"
      >
        <input
          id={`${fid}-kind`}
          name="kind"
          defaultValue={event?.kind ?? "event"}
          className={fieldInputClass}
          placeholder="event / draft / meetup / nfl"
        />
      </Field>
      <Field
        label="Location"
        htmlFor={`${fid}-location`}
        className="sm:col-span-2"
        hint="Optional"
      >
        <input
          id={`${fid}-location`}
          name="location"
          defaultValue={event?.location ?? ""}
          className={fieldInputClass}
          placeholder="Zoom / Dan’s basement / …"
        />
      </Field>
    </div>
  );
}
