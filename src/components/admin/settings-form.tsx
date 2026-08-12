"use client";

import type { LeagueSettings } from "@/lib/types";
import { updateLeagueSettings } from "@/lib/actions/admin/settings";
import { ActionForm } from "./action-form";
import { SubmitButton } from "./submit-button";
import { Field, fieldInputClass, fieldTextareaClass } from "./field";

export function SettingsForm({ league }: { league: LeagueSettings }) {
  return (
    <div className="rounded-xl border-2 border-foreground bg-white p-5 shadow-sm sm:p-6">
      <h2 className="ff-display text-xl">League settings</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Controls homepage copy, dues amount, and season year.
      </p>

      <ActionForm action={updateLeagueSettings} className="mt-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="League name" htmlFor="name">
            <input
              id="name"
              name="name"
              required
              defaultValue={league.name}
              className={fieldInputClass}
            />
          </Field>
          <Field label="Tagline" htmlFor="tagline">
            <input
              id="tagline"
              name="tagline"
              required
              defaultValue={league.tagline}
              className={fieldInputClass}
            />
          </Field>
          <Field label="Rules summary" htmlFor="rules_summary" className="sm:col-span-2">
            <input
              id="rules_summary"
              name="rules_summary"
              required
              defaultValue={league.rules_summary}
              className={fieldInputClass}
            />
          </Field>
          <Field label="Trophy blurb" htmlFor="trophy_blurb" className="sm:col-span-2">
            <textarea
              id="trophy_blurb"
              name="trophy_blurb"
              required
              defaultValue={league.trophy_blurb}
              className={fieldTextareaClass}
            />
          </Field>
          <Field label="Dues amount ($)" htmlFor="dues_amount">
            <input
              id="dues_amount"
              name="dues_amount"
              type="number"
              min={0}
              step="0.01"
              required
              defaultValue={league.dues_amount}
              className={fieldInputClass}
            />
          </Field>
          <Field label="Season year" htmlFor="season_year">
            <input
              id="season_year"
              name="season_year"
              type="number"
              required
              defaultValue={league.season_year}
              className={fieldInputClass}
            />
          </Field>
          <Field label="Keepers" htmlFor="keeper_count">
            <input
              id="keeper_count"
              name="keeper_count"
              type="number"
              min={0}
              required
              defaultValue={league.keeper_count}
              className={fieldInputClass}
            />
          </Field>
          <Field label="Max keeper seasons" htmlFor="keeper_max_seasons">
            <input
              id="keeper_max_seasons"
              name="keeper_max_seasons"
              type="number"
              min={1}
              required
              defaultValue={league.keeper_max_seasons}
              className={fieldInputClass}
            />
          </Field>
        </div>
        <SubmitButton className="mt-2">Save settings</SubmitButton>
      </ActionForm>
    </div>
  );
}
