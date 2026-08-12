"use client";

import type { LeagueSettings, Matchup, Owner, Standing } from "@/lib/types";
import {
  createMatchup,
  updateMatchup,
  deleteMatchup,
  upsertStanding,
} from "@/lib/actions/admin/matchups";
import { ActionForm } from "./action-form";
import { SubmitButton } from "./submit-button";
import { Field, fieldInputClass } from "./field";
import { formatRecord } from "@/lib/utils";

export function MatchupsManager({
  league,
  owners,
  matchups,
  standings,
  season,
}: {
  league: LeagueSettings;
  owners: Owner[];
  matchups: Matchup[];
  standings: Standing[];
  season: number;
}) {
  const byWeek = new Map<number, Matchup[]>();
  for (const m of matchups) {
    const list = byWeek.get(m.week) ?? [];
    list.push(m);
    byWeek.set(m.week, list);
  }
  const weeks = [...byWeek.keys()].sort((a, b) => b - a);

  const standingByOwner = new Map(standings.map((s) => [s.owner_id, s]));

  return (
    <div className="space-y-8">
      <section className="rounded-xl border-2 border-foreground bg-white p-5 shadow-sm sm:p-6">
        <h2 className="ff-display text-xl">Add matchup</h2>
        <ActionForm action={createMatchup} className="mt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Season" htmlFor="season">
              <input
                id="season"
                name="season"
                type="number"
                required
                defaultValue={season || league.season_year}
                className={fieldInputClass}
              />
            </Field>
            <Field label="Week" htmlFor="week">
              <input
                id="week"
                name="week"
                type="number"
                min={1}
                max={20}
                required
                defaultValue={1}
                className={fieldInputClass}
              />
            </Field>
            <Field label="Home" htmlFor="home_owner_id">
              <select
                id="home_owner_id"
                name="home_owner_id"
                required
                className={fieldInputClass}
                defaultValue=""
              >
                <option value="" disabled>
                  Select owner
                </option>
                {owners.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.display_name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Away" htmlFor="away_owner_id">
              <select
                id="away_owner_id"
                name="away_owner_id"
                required
                className={fieldInputClass}
                defaultValue=""
              >
                <option value="" disabled>
                  Select owner
                </option>
                {owners.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.display_name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <label className="inline-flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" name="is_playoff" className="h-4 w-4 accent-foreground" />
            Playoff game
          </label>
          <SubmitButton>Add matchup</SubmitButton>
        </ActionForm>
      </section>

      <section className="space-y-4">
        <h2 className="ff-display text-xl">Weekly results</h2>
        {weeks.length === 0 && (
          <p className="rounded-xl border-2 border-dashed border-border p-6 text-sm text-muted-foreground">
            No matchups yet. Add one above.
          </p>
        )}
        {weeks.map((week) => (
          <div key={week} className="space-y-3">
            <h3 className="ff-display text-sm tracking-wide text-muted-foreground">
              Week {week}
            </h3>
            {(byWeek.get(week) ?? []).map((m) => (
              <div
                key={m.id}
                className="rounded-xl border-2 border-foreground bg-white p-4 shadow-sm"
              >
                <p className="mb-3 ff-display text-sm">
                  {m.home_owner?.display_name ?? "Home"} vs{" "}
                  {m.away_owner?.display_name ?? "Away"}
                  {m.is_playoff ? " · playoff" : ""}
                </p>
                <ActionForm action={updateMatchup}>
                  <input type="hidden" name="id" value={m.id} />
                  <div className="grid gap-3 sm:grid-cols-4">
                    <Field label="Home score">
                      <input
                        name="home_score"
                        type="number"
                        min={0}
                        step="0.01"
                        defaultValue={m.home_score ?? ""}
                        className={fieldInputClass}
                      />
                    </Field>
                    <Field label="Away score">
                      <input
                        name="away_score"
                        type="number"
                        min={0}
                        step="0.01"
                        defaultValue={m.away_score ?? ""}
                        className={fieldInputClass}
                      />
                    </Field>
                    <label className="flex items-end gap-2 pb-2 text-sm font-semibold">
                      <input
                        type="checkbox"
                        name="is_complete"
                        defaultChecked={m.is_complete}
                        className="h-4 w-4 accent-foreground"
                      />
                      Final
                    </label>
                    <label className="flex items-end gap-2 pb-2 text-sm font-semibold">
                      <input
                        type="checkbox"
                        name="is_playoff"
                        defaultChecked={m.is_playoff}
                        className="h-4 w-4 accent-foreground"
                      />
                      Playoff
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <SubmitButton>Update scores</SubmitButton>
                  </div>
                </ActionForm>
                <ActionForm action={deleteMatchup} className="mt-2">
                  <input type="hidden" name="id" value={m.id} />
                  <SubmitButton variant="outline">Delete matchup</SubmitButton>
                </ActionForm>
              </div>
            ))}
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="ff-display text-xl">Season standings ({season})</h2>
        <p className="text-sm text-muted-foreground">
          Season-to-date rows (week = null). Used on the Matchups page when present.
        </p>
        {owners.map((owner, idx) => {
          const s = standingByOwner.get(owner.id);
          return (
            <div
              key={owner.id}
              className="rounded-xl border-2 border-foreground bg-white p-4 shadow-sm"
            >
              <p className="mb-3 ff-display text-sm">
                {owner.display_name}{" "}
                <span className="font-mono text-xs font-normal normal-case tracking-normal text-muted-foreground">
                  franchise {formatRecord(owner.wins, owner.losses)}
                </span>
              </p>
              <ActionForm action={upsertStanding}>
                <input type="hidden" name="owner_id" value={owner.id} />
                <input type="hidden" name="season" value={season} />
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  <Field label="Wins">
                    <input
                      name="wins"
                      type="number"
                      min={0}
                      required
                      defaultValue={s?.wins ?? 0}
                      className={fieldInputClass}
                    />
                  </Field>
                  <Field label="Losses">
                    <input
                      name="losses"
                      type="number"
                      min={0}
                      required
                      defaultValue={s?.losses ?? 0}
                      className={fieldInputClass}
                    />
                  </Field>
                  <Field label="Ties">
                    <input
                      name="ties"
                      type="number"
                      min={0}
                      defaultValue={s?.ties ?? 0}
                      className={fieldInputClass}
                    />
                  </Field>
                  <Field label="PF">
                    <input
                      name="points_for"
                      type="number"
                      min={0}
                      step="0.01"
                      required
                      defaultValue={s?.points_for ?? 0}
                      className={fieldInputClass}
                    />
                  </Field>
                  <Field label="PA">
                    <input
                      name="points_against"
                      type="number"
                      min={0}
                      step="0.01"
                      required
                      defaultValue={s?.points_against ?? 0}
                      className={fieldInputClass}
                    />
                  </Field>
                  <Field label="Rank">
                    <input
                      name="rank"
                      type="number"
                      min={1}
                      required
                      defaultValue={s?.rank || idx + 1}
                      className={fieldInputClass}
                    />
                  </Field>
                </div>
                <SubmitButton>Save standing</SubmitButton>
              </ActionForm>
            </div>
          );
        })}
      </section>
    </div>
  );
}
