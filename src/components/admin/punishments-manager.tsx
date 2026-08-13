"use client";

import type { Owner, Punishment } from "@/lib/types";
import {
  createPunishment,
  updatePunishment,
  deletePunishment,
} from "@/lib/actions/admin/punishments";
import { ActionForm } from "./action-form";
import { SubmitButton } from "./submit-button";
import { Field, fieldInputClass, fieldTextareaClass } from "./field";

export function PunishmentsManager({
  punishments,
  owners,
  error,
}: {
  punishments: Punishment[];
  owners: Owner[];
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
              supabase/migrate-seasons-punishments.sql
            </code>
            .
          </p>
        </div>
      )}

      <section className="ff-card p-5 sm:p-6">
        <h2 className="ff-display text-xl">Record a punishment</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Wall of Shame material. Shows on /punishments and owner profiles.
        </p>
        <ActionForm action={createPunishment} className="mt-4">
          <PunishmentFields owners={owners} />
          <SubmitButton>Add punishment</SubmitButton>
        </ActionForm>
      </section>

      <section className="space-y-4">
        <h2 className="ff-display text-xl">
          On the wall ({punishments.length})
        </h2>
        {punishments.length === 0 && (
          <p className="ff-card p-6 text-sm text-muted-foreground">
            No punishments yet. The gauntlet awaits.
          </p>
        )}
        {punishments.map((p) => (
          <article key={p.id} className="ff-card p-4 sm:p-5">
            <p className="mb-3 text-sm font-semibold text-muted-foreground">
              {p.season_year} ·{" "}
              {p.owner?.display_name || p.owner_label || "Unknown"} · {p.title}
            </p>
            <ActionForm action={updatePunishment}>
              <input type="hidden" name="id" value={p.id} />
              <PunishmentFields owners={owners} punishment={p} />
              <SubmitButton>Save</SubmitButton>
            </ActionForm>
            <ActionForm
              action={deletePunishment}
              className="mt-3 border-t border-border pt-3"
            >
              <input type="hidden" name="id" value={p.id} />
              <SubmitButton variant="outline">Delete</SubmitButton>
            </ActionForm>
          </article>
        ))}
      </section>
    </div>
  );
}

function PunishmentFields({
  owners,
  punishment,
}: {
  owners: Owner[];
  punishment?: Punishment;
}) {
  const fid = punishment?.id ?? "new";
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Year" htmlFor={`${fid}-year`}>
        <input
          id={`${fid}-year`}
          name="season_year"
          type="number"
          required
          min={1990}
          max={2100}
          defaultValue={punishment?.season_year ?? 2025}
          className={fieldInputClass}
        />
      </Field>
      <Field label="Title" htmlFor={`${fid}-title`}>
        <input
          id={`${fid}-title`}
          name="title"
          defaultValue={punishment?.title ?? "Punishment"}
          className={fieldInputClass}
          placeholder="e.g. Last place gauntlet"
        />
      </Field>
      <Field label="Owner (linked)" htmlFor={`${fid}-owner`}>
        <select
          id={`${fid}-owner`}
          name="owner_id"
          defaultValue={punishment?.owner_id ?? ""}
          className={fieldInputClass}
        >
          <option value="">— Optional —</option>
          {owners.map((o) => (
            <option key={o.id} value={o.id}>
              {o.display_name}
            </option>
          ))}
        </select>
      </Field>
      <Field
        label="Name label"
        htmlFor={`${fid}-label`}
        hint="If owner not linked"
      >
        <input
          id={`${fid}-label`}
          name="owner_label"
          defaultValue={punishment?.owner_label ?? ""}
          className={fieldInputClass}
          placeholder="Display name fallback"
        />
      </Field>
      <Field
        label="Description"
        htmlFor={`${fid}-desc`}
        className="sm:col-span-2"
      >
        <textarea
          id={`${fid}-desc`}
          name="description"
          required
          rows={3}
          defaultValue={punishment?.description ?? ""}
          className={fieldTextareaClass}
          placeholder="What did they have to do?"
        />
      </Field>
      <Field
        label="Photo / link URL"
        htmlFor={`${fid}-photo`}
        className="sm:col-span-2"
      >
        <input
          id={`${fid}-photo`}
          name="photo_url"
          defaultValue={punishment?.photo_url ?? ""}
          className={fieldInputClass}
          placeholder="https://…"
        />
      </Field>
      <Field label="Notes" htmlFor={`${fid}-notes`} className="sm:col-span-2">
        <textarea
          id={`${fid}-notes`}
          name="notes"
          rows={2}
          defaultValue={punishment?.notes ?? ""}
          className={fieldTextareaClass}
        />
      </Field>
      <Field label="Sort order" htmlFor={`${fid}-sort`}>
        <input
          id={`${fid}-sort`}
          name="sort_order"
          type="number"
          min={0}
          defaultValue={punishment?.sort_order ?? 0}
          className={fieldInputClass}
        />
      </Field>
    </div>
  );
}
