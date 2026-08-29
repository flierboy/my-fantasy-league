"use client";

import type { DepartedOwner } from "@/lib/types";
import {
  createDepartedOwner,
  updateDepartedOwner,
  deleteDepartedOwner,
} from "@/lib/actions/admin/dead";
import { ActionForm } from "./action-form";
import { SubmitButton } from "./submit-button";
import { Field, fieldInputClass, fieldTextareaClass } from "./field";

export function DeadManager({
  departed,
  error,
}: {
  departed: DepartedOwner[];
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
            <code className="font-mono">
              supabase/migrate-departed-owners.sql
            </code>
            .
          </p>
        </div>
      )}

      <section className="ff-card p-5 sm:p-6">
        <h2 className="ff-display text-xl">Lay someone to rest</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Wall of the Dead entries. Shows on /dead.
        </p>
        <ActionForm action={createDepartedOwner} className="mt-4">
          <DepartedFields />
          <SubmitButton>Add departed owner</SubmitButton>
        </ActionForm>
      </section>

      <section className="space-y-4">
        <h2 className="ff-display text-xl">
          On the wall ({departed.length})
        </h2>
        {departed.length === 0 && (
          <p className="ff-card p-6 text-sm text-muted-foreground">
            Nobody&apos;s died. Yet.
          </p>
        )}
        {departed.map((d) => (
          <article key={d.id} className="ff-card p-4 sm:p-5">
            <p className="mb-3 text-sm font-semibold text-muted-foreground">
              {d.departed_year} · {d.display_name}
            </p>
            <ActionForm action={updateDepartedOwner}>
              <input type="hidden" name="id" value={d.id} />
              <DepartedFields departed={d} />
              <SubmitButton>Save</SubmitButton>
            </ActionForm>
            <ActionForm
              action={deleteDepartedOwner}
              className="mt-3 border-t border-border pt-3"
            >
              <input type="hidden" name="id" value={d.id} />
              <SubmitButton variant="outline">Delete</SubmitButton>
            </ActionForm>
          </article>
        ))}
      </section>
    </div>
  );
}

function DepartedFields({ departed }: { departed?: DepartedOwner }) {
  const fid = departed?.id ?? "new";
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Name" htmlFor={`${fid}-name`}>
        <input
          id={`${fid}-name`}
          name="display_name"
          required
          defaultValue={departed?.display_name ?? ""}
          className={fieldInputClass}
          placeholder="Display name"
        />
      </Field>
      <Field label="Left after (year)" htmlFor={`${fid}-year`}>
        <input
          id={`${fid}-year`}
          name="departed_year"
          type="number"
          required
          min={1990}
          max={2100}
          defaultValue={departed?.departed_year ?? new Date().getFullYear()}
          className={fieldInputClass}
        />
      </Field>
      <Field
        label="Epitaph"
        htmlFor={`${fid}-epitaph`}
        className="sm:col-span-2"
        hint="Official last words / why they left"
      >
        <textarea
          id={`${fid}-epitaph`}
          name="epitaph"
          required
          rows={3}
          defaultValue={departed?.epitaph ?? ""}
          className={fieldTextareaClass}
          placeholder="They fought the waiver wire and the waiver wire won."
        />
      </Field>
      <Field label="Sort order" htmlFor={`${fid}-sort`}>
        <input
          id={`${fid}-sort`}
          name="sort_order"
          type="number"
          min={0}
          defaultValue={departed?.sort_order ?? 0}
          className={fieldInputClass}
        />
      </Field>
    </div>
  );
}
