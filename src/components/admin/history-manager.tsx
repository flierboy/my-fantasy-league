"use client";

import type { HistoryEntry } from "@/lib/types";
import { HISTORY_ENTRY_TYPES } from "@/lib/types";
import {
  createHistoryEntry,
  updateHistoryEntry,
  deleteHistoryEntry,
} from "@/lib/actions/admin/history";
import { ActionForm } from "./action-form";
import { SubmitButton } from "./submit-button";
import { Field, fieldInputClass, fieldTextareaClass } from "./field";

export function HistoryManager({ entries }: { entries: HistoryEntry[] }) {
  return (
    <div className="space-y-8">
      <section className="ff-card p-5 sm:p-6">
        <h2 className="ff-display text-xl">Add history entry</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Champions, milestones, records, or free-form season notes. Shows on
          the public History page.
        </p>
        <ActionForm action={createHistoryEntry} className="mt-4">
          <HistoryFields />
          <SubmitButton>Add entry</SubmitButton>
        </ActionForm>
      </section>

      <section className="space-y-4">
        <h2 className="ff-display text-xl">
          Existing entries ({entries.length})
        </h2>
        {entries.length === 0 && (
          <p className="ff-card p-6 text-sm text-muted-foreground">
            No entries yet. Add your first champion or milestone above.
          </p>
        )}
        {entries.map((entry) => (
          <article key={entry.id} className="ff-card p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border-2 border-foreground bg-[#f4f2ef] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                {entry.entry_type}
              </span>
              <span className="ff-display text-sm">{entry.year_label}</span>
              <span className="text-sm font-semibold text-muted-foreground">
                {entry.title}
              </span>
            </div>

            <ActionForm action={updateHistoryEntry}>
              <input type="hidden" name="id" value={entry.id} />
              <HistoryFields entry={entry} />
              <div className="flex flex-wrap gap-2">
                <SubmitButton>Save changes</SubmitButton>
              </div>
            </ActionForm>

            <ActionForm
              action={deleteHistoryEntry}
              className="mt-3 border-t border-border pt-3"
            >
              <input type="hidden" name="id" value={entry.id} />
              <SubmitButton variant="outline">Delete entry</SubmitButton>
            </ActionForm>
          </article>
        ))}
      </section>
    </div>
  );
}

function HistoryFields({ entry }: { entry?: HistoryEntry }) {
  const fid = entry?.id ?? "new";
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Record type" htmlFor={`${fid}-type`}>
        <select
          id={`${fid}-type`}
          name="entry_type"
          required
          defaultValue={entry?.entry_type ?? "champion"}
          className={fieldInputClass}
        >
          {HISTORY_ENTRY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label} — {t.hint}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Year / season label"
        htmlFor={`${fid}-year`}
        hint='e.g. "2024" or "2025 playoffs"'
      >
        <input
          id={`${fid}-year`}
          name="year_label"
          required
          defaultValue={entry?.year_label ?? ""}
          placeholder="2024"
          className={fieldInputClass}
        />
      </Field>

      <Field
        label="Season year (number)"
        htmlFor={`${fid}-season`}
        hint="Optional — for sorting champions"
      >
        <input
          id={`${fid}-season`}
          name="season_year"
          type="number"
          min={1990}
          max={2100}
          defaultValue={entry?.season_year ?? ""}
          className={fieldInputClass}
        />
      </Field>

      <Field label="Sort order" htmlFor={`${fid}-sort`} hint="Lower = first">
        <input
          id={`${fid}-sort`}
          name="sort_order"
          type="number"
          min={0}
          defaultValue={entry?.sort_order ?? 0}
          className={fieldInputClass}
        />
      </Field>

      <Field
        label="Title"
        htmlFor={`${fid}-title`}
        className="sm:col-span-2"
        hint="For champions, can auto-fill if left blank"
      >
        <input
          id={`${fid}-title`}
          name="title"
          defaultValue={entry?.title ?? ""}
          placeholder="League reborn / High score / Season 2024"
          className={fieldInputClass}
        />
      </Field>

      <Field label="Champion / winner" htmlFor={`${fid}-champion`}>
        <input
          id={`${fid}-champion`}
          name="champion"
          defaultValue={entry?.champion ?? ""}
          placeholder="Team or owner name"
          className={fieldInputClass}
        />
      </Field>

      <Field label="Runner-up" htmlFor={`${fid}-runner`}>
        <input
          id={`${fid}-runner`}
          name="runner_up"
          defaultValue={entry?.runner_up ?? ""}
          placeholder="Optional"
          className={fieldInputClass}
        />
      </Field>

      <Field
        label="Notes / details"
        htmlFor={`${fid}-notes`}
        className="sm:col-span-2"
      >
        <textarea
          id={`${fid}-notes`}
          name="notes"
          rows={3}
          defaultValue={entry?.notes ?? ""}
          placeholder="Free-form history text, stats, or season recap…"
          className={fieldTextareaClass}
        />
      </Field>
    </div>
  );
}
