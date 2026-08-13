"use client";

import type { DraftPick, DraftYear, Owner } from "@/lib/types";
import { DRAFT_SOURCE_OPTIONS } from "@/lib/types";
import {
  createDraftYear,
  updateDraftYear,
  deleteDraftYear,
  upsertDraftPick,
  deleteDraftPick,
  bulkImportDraftPicks,
} from "@/lib/actions/admin/drafts";
import { ActionForm } from "./action-form";
import { SubmitButton } from "./submit-button";
import { Field, fieldInputClass, fieldTextareaClass } from "./field";

export function DraftsManager({
  years,
  owners,
  error,
}: {
  years: DraftYear[];
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
            <code className="font-mono">supabase/migrate-draft-history.sql</code>{" "}
            in the SQL Editor.
          </p>
        </div>
      )}

      <section className="ff-card p-5 sm:p-6">
        <h2 className="ff-display text-xl">Add draft year</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a year shell, then import picks via CSV/JSON or add them one at
          a time.
        </p>
        <ActionForm action={createDraftYear} className="mt-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Season year" htmlFor="new-year">
              <input
                id="new-year"
                name="season_year"
                type="number"
                required
                min={1990}
                max={2100}
                defaultValue={2025}
                className={fieldInputClass}
              />
            </Field>
            <Field label="Source" htmlFor="new-source">
              <select
                id="new-source"
                name="source"
                className={fieldInputClass}
                defaultValue="espn"
              >
                {DRAFT_SOURCE_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Notes" htmlFor="new-notes">
              <input
                id="new-notes"
                name="notes"
                className={fieldInputClass}
                placeholder="Optional"
              />
            </Field>
          </div>
          <SubmitButton>Create draft year</SubmitButton>
        </ActionForm>
      </section>

      <section className="space-y-6">
        <h2 className="ff-display text-xl">Draft years ({years.length})</h2>
        {years.length === 0 && (
          <p className="ff-card p-6 text-sm text-muted-foreground">
            No draft years yet. Add 2023, 2024, and 2025, then bulk-import picks.
          </p>
        )}
        {years.map((year) => (
          <DraftYearCard key={year.id} year={year} owners={owners} />
        ))}
      </section>
    </div>
  );
}

function DraftYearCard({
  year,
  owners,
}: {
  year: DraftYear;
  owners: Owner[];
}) {
  const picks = year.picks ?? [];
  return (
    <article className="ff-card space-y-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div>
          <h3 className="ff-display text-lg">{year.season_year} draft</h3>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {year.source} · {picks.length} picks
          </p>
        </div>
      </div>

      <ActionForm action={updateDraftYear}>
        <input type="hidden" name="id" value={year.id} />
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Season year" htmlFor={`${year.id}-y`}>
            <input
              id={`${year.id}-y`}
              name="season_year"
              type="number"
              required
              defaultValue={year.season_year}
              className={fieldInputClass}
            />
          </Field>
          <Field label="Source" htmlFor={`${year.id}-s`}>
            <select
              id={`${year.id}-s`}
              name="source"
              defaultValue={year.source}
              className={fieldInputClass}
            >
              {DRAFT_SOURCE_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Notes" htmlFor={`${year.id}-n`}>
            <input
              id={`${year.id}-n`}
              name="notes"
              defaultValue={year.notes ?? ""}
              className={fieldInputClass}
            />
          </Field>
        </div>
        <SubmitButton>Save year</SubmitButton>
      </ActionForm>

      {/* Bulk import */}
      <div className="rounded-lg border-2 border-dashed border-border bg-[#f4f2ef]/50 p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Bulk import picks
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          CSV header:{" "}
          <code className="font-mono text-[11px]">
            round,pick_in_round,overall_pick,player_name,position,nfl_team,fantasy_owner_name
          </code>
        </p>
        <ActionForm action={bulkImportDraftPicks} className="mt-3">
          <input type="hidden" name="draft_year_id" value={year.id} />
          <Field label="CSV" htmlFor={`${year.id}-csv`}>
            <textarea
              id={`${year.id}-csv`}
              name="csv"
              rows={6}
              className={fieldTextareaClass + " font-mono text-xs"}
              placeholder="1,1,1,Justin Jefferson,WR,MIN,THICKY LEN"
            />
          </Field>
          <label className="inline-flex items-center gap-2 text-xs font-semibold">
            <input type="checkbox" name="replace" className="accent-foreground" />
            Replace all existing picks for this year
          </label>
          <SubmitButton>Import CSV</SubmitButton>
        </ActionForm>
      </div>

      {/* Add single pick */}
      <div className="border-t border-border pt-4">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Add single pick
        </p>
        <ActionForm action={upsertDraftPick}>
          <input type="hidden" name="draft_year_id" value={year.id} />
          <input type="hidden" name="season_year" value={year.season_year} />
          <PickFields owners={owners} prefix={`${year.id}-new`} />
          <SubmitButton>Add pick</SubmitButton>
        </ActionForm>
      </div>

      {/* Picks table */}
      <div className="overflow-x-auto border-t border-border pt-4">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead className="border-b-2 border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-1 py-2">Ovr</th>
              <th className="px-1 py-2">Rd</th>
              <th className="px-1 py-2">Pk</th>
              <th className="px-1 py-2">Player</th>
              <th className="px-1 py-2">Pos</th>
              <th className="px-1 py-2">NFL</th>
              <th className="px-1 py-2">Fantasy team</th>
              <th className="px-1 py-2">Owner</th>
              <th className="px-1 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {picks.map((pick) => (
              <PickRow key={pick.id} pick={pick} owners={owners} />
            ))}
            {picks.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-2 py-4 text-muted-foreground"
                >
                  No picks yet — import CSV above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ActionForm action={deleteDraftYear} className="border-t border-border pt-3">
        <input type="hidden" name="id" value={year.id} />
        <SubmitButton variant="outline">Delete draft year</SubmitButton>
      </ActionForm>
    </article>
  );
}

function PickRow({ pick, owners }: { pick: DraftPick; owners: Owner[] }) {
  return (
    <tr className="align-top">
      <td colSpan={9} className="px-1 py-2">
        <ActionForm action={upsertDraftPick} className="!space-y-2">
          <input type="hidden" name="id" value={pick.id} />
          <input type="hidden" name="draft_year_id" value={pick.draft_year_id} />
          <input type="hidden" name="season_year" value={pick.season_year} />
          <PickFields
            owners={owners}
            prefix={pick.id}
            pick={pick}
            compact
          />
          <div className="flex flex-wrap gap-2">
            <SubmitButton>Save</SubmitButton>
          </div>
        </ActionForm>
        <ActionForm action={deleteDraftPick} className="mt-1">
          <input type="hidden" name="id" value={pick.id} />
          <SubmitButton variant="outline">Delete pick</SubmitButton>
        </ActionForm>
      </td>
    </tr>
  );
}

function PickFields({
  owners,
  prefix,
  pick,
  compact,
}: {
  owners: Owner[];
  prefix: string;
  pick?: DraftPick;
  compact?: boolean;
}) {
  const input = compact
    ? "h-8 w-full min-w-0 rounded border border-border bg-white px-1.5 text-xs"
    : fieldInputClass;

  return (
    <div
      className={
        compact
          ? "grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-8"
          : "grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      }
    >
      <Field label="Overall" htmlFor={`${prefix}-ovr`}>
        <input
          id={`${prefix}-ovr`}
          name="overall_pick"
          type="number"
          min={1}
          required
          defaultValue={pick?.overall_pick ?? ""}
          className={input}
        />
      </Field>
      <Field label="Round" htmlFor={`${prefix}-rd`}>
        <input
          id={`${prefix}-rd`}
          name="round"
          type="number"
          min={1}
          required
          defaultValue={pick?.round ?? ""}
          className={input}
        />
      </Field>
      <Field label="Pick" htmlFor={`${prefix}-pk`}>
        <input
          id={`${prefix}-pk`}
          name="pick_in_round"
          type="number"
          min={1}
          required
          defaultValue={pick?.pick_in_round ?? ""}
          className={input}
        />
      </Field>
      <Field label="Player" htmlFor={`${prefix}-pl`}>
        <input
          id={`${prefix}-pl`}
          name="player_name"
          required
          defaultValue={pick?.player_name ?? ""}
          className={input}
        />
      </Field>
      <Field label="Pos" htmlFor={`${prefix}-pos`}>
        <input
          id={`${prefix}-pos`}
          name="position"
          defaultValue={pick?.position ?? ""}
          className={input}
          placeholder="QB"
        />
      </Field>
      <Field label="NFL" htmlFor={`${prefix}-nfl`}>
        <input
          id={`${prefix}-nfl`}
          name="nfl_team"
          defaultValue={pick?.nfl_team ?? ""}
          className={input}
          placeholder="MIN"
        />
      </Field>
      <Field label="Fantasy team" htmlFor={`${prefix}-ft`}>
        <input
          id={`${prefix}-ft`}
          name="fantasy_owner_name"
          defaultValue={pick?.fantasy_owner_name ?? ""}
          className={input}
        />
      </Field>
      <Field label="Owner" htmlFor={`${prefix}-ow`}>
        <select
          id={`${prefix}-ow`}
          name="owner_id"
          defaultValue={pick?.owner_id ?? ""}
          className={input}
        >
          <option value="">— Auto / none —</option>
          {owners.map((o) => (
            <option key={o.id} value={o.id}>
              {o.display_name}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}
