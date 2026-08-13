"use client";

import { useState, useTransition } from "react";
import type { Owner, PastSeason } from "@/lib/types";
import {
  createPastSeason,
  updatePastSeason,
  deletePastSeason,
  saveSeasonStandings,
} from "@/lib/actions/admin/seasons";
import type { ActionResult } from "@/lib/actions/admin/types";
import { ActionForm } from "./action-form";
import { SubmitButton } from "./submit-button";
import { Field, fieldInputClass, fieldTextareaClass } from "./field";
import { FormMessage } from "./form-message";
import { Button } from "@/components/ui/button";
import { formatRecord } from "@/lib/utils";

type StandingDraft = {
  id: string;
  owner_id: string;
  team_name: string;
  wins: string;
  losses: string;
  ties: string;
  points_for: string;
  points_against: string;
  rank: string;
  is_champion: boolean;
  is_runner_up: boolean;
};

function toDraft(season: PastSeason): StandingDraft[] {
  const rows = [...(season.standings ?? [])].sort(
    (a, b) => a.rank - b.rank || a.wins - b.wins
  );
  return rows.map((r) => ({
    id: r.id,
    owner_id: r.owner_id ?? "",
    team_name: r.team_name ?? r.owner?.display_name ?? "",
    wins: String(r.wins),
    losses: String(r.losses),
    ties: String(r.ties),
    points_for: String(r.points_for),
    points_against: String(r.points_against),
    rank: String(r.rank),
    is_champion: r.is_champion,
    is_runner_up: r.is_runner_up,
  }));
}

export function SeasonsManager({
  seasons,
  owners,
  error,
}: {
  seasons: PastSeason[];
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
            </code>{" "}
            in Supabase SQL Editor.
          </p>
        </div>
      )}

      <section className="ff-card p-5 sm:p-6">
        <h2 className="ff-display text-xl">Add past season</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Creates a season and seeds standings rows for every owner. Fill W-L /
          PF / PA below.
        </p>
        <ActionForm action={createPastSeason} className="mt-4">
          <SeasonMetaFields owners={owners} />
          <SubmitButton>Create season</SubmitButton>
        </ActionForm>
      </section>

      <section className="space-y-6">
        <h2 className="ff-display text-xl">
          Seasons ({seasons.length})
        </h2>
        {seasons.length === 0 && (
          <p className="ff-card p-6 text-sm text-muted-foreground">
            No past seasons yet. Add 2023 / 2024 / 2025 above.
          </p>
        )}
        {seasons.map((season) => (
          <SeasonEditor key={season.id} season={season} owners={owners} />
        ))}
      </section>
    </div>
  );
}

function SeasonMetaFields({
  owners,
  season,
}: {
  owners: Owner[];
  season?: PastSeason;
}) {
  const fid = season?.id ?? "new";
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Season year" htmlFor={`${fid}-year`}>
        <input
          id={`${fid}-year`}
          name="season_year"
          type="number"
          required
          min={1990}
          max={2100}
          defaultValue={season?.season_year ?? 2025}
          className={fieldInputClass}
        />
      </Field>
      <Field label="Label" htmlFor={`${fid}-label`} hint='e.g. "2024"'>
        <input
          id={`${fid}-label`}
          name="label"
          defaultValue={season?.label ?? ""}
          className={fieldInputClass}
        />
      </Field>
      <Field label="Champion" htmlFor={`${fid}-champ`}>
        <select
          id={`${fid}-champ`}
          name="champion_owner_id"
          defaultValue={season?.champion_owner_id ?? ""}
          className={fieldInputClass}
        >
          <option value="">— None —</option>
          {owners.map((o) => (
            <option key={o.id} value={o.id}>
              {o.display_name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Runner-up" htmlFor={`${fid}-ru`}>
        <select
          id={`${fid}-ru`}
          name="runner_up_owner_id"
          defaultValue={season?.runner_up_owner_id ?? ""}
          className={fieldInputClass}
        >
          <option value="">— None —</option>
          {owners.map((o) => (
            <option key={o.id} value={o.id}>
              {o.display_name}
            </option>
          ))}
        </select>
      </Field>
      <Field
        label="Season recap notes"
        htmlFor={`${fid}-recap`}
        className="sm:col-span-2"
      >
        <textarea
          id={`${fid}-recap`}
          name="recap_notes"
          rows={3}
          defaultValue={season?.recap_notes ?? ""}
          className={fieldTextareaClass}
          placeholder="How the season went…"
        />
      </Field>
      <Field label="Sort order" htmlFor={`${fid}-sort`}>
        <input
          id={`${fid}-sort`}
          name="sort_order"
          type="number"
          min={0}
          defaultValue={season?.sort_order ?? 0}
          className={fieldInputClass}
        />
      </Field>
    </div>
  );
}

function SeasonEditor({
  season,
  owners,
}: {
  season: PastSeason;
  owners: Owner[];
}) {
  const [drafts, setDrafts] = useState(() => toDraft(season));
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  const updateRow = (id: string, patch: Partial<StandingDraft>) => {
    setDrafts((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const next = { ...r, ...patch };
        // exclusive champ / runner flags within season
        if (patch.is_champion) next.is_runner_up = false;
        if (patch.is_runner_up) next.is_champion = false;
        return next;
      }).map((r) => {
        if (patch.is_champion && r.id !== id) return { ...r, is_champion: false };
        if (patch.is_runner_up && r.id !== id)
          return { ...r, is_runner_up: false };
        return r;
      })
    );
    setResult(null);
  };

  const saveStandings = () => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("season_id", season.id);
      fd.set(
        "payload",
        JSON.stringify(
          drafts.map((d) => ({
            id: d.id,
            owner_id: d.owner_id || null,
            team_name: d.team_name,
            wins: d.wins,
            losses: d.losses,
            ties: d.ties,
            points_for: d.points_for,
            points_against: d.points_against,
            rank: d.rank,
            is_champion: d.is_champion,
            is_runner_up: d.is_runner_up,
          }))
        )
      );
      const res = await saveSeasonStandings(fd);
      setResult(res);
    });
  };

  return (
    <article className="ff-card space-y-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div>
          <h3 className="ff-display text-lg">
            {season.label || season.season_year}
          </h3>
          <p className="text-xs text-muted-foreground">
            {season.champion
              ? `Champ · ${season.champion.display_name}`
              : "No champion set"}
            {season.runner_up
              ? ` · Runner-up · ${season.runner_up.display_name}`
              : ""}
          </p>
        </div>
      </div>

      <ActionForm action={updatePastSeason}>
        <input type="hidden" name="id" value={season.id} />
        <SeasonMetaFields owners={owners} season={season} />
        <SubmitButton>Save season meta</SubmitButton>
      </ActionForm>

      <div className="space-y-2 border-t border-border pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Standings
          </p>
          <Button
            type="button"
            size="sm"
            onClick={saveStandings}
            disabled={pending}
          >
            {pending ? "Saving…" : "Save standings"}
          </Button>
        </div>
        <FormMessage result={result} />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead className="border-b-2 border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-1 py-2">Rk</th>
                <th className="px-1 py-2">Owner</th>
                <th className="px-1 py-2">Team</th>
                <th className="px-1 py-2">W</th>
                <th className="px-1 py-2">L</th>
                <th className="px-1 py-2">T</th>
                <th className="px-1 py-2">PF</th>
                <th className="px-1 py-2">PA</th>
                <th className="px-1 py-2">🏆</th>
                <th className="px-1 py-2">🥈</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {drafts.map((row) => {
                const owner = owners.find((o) => o.id === row.owner_id);
                return (
                  <tr key={row.id} className="align-middle">
                    <td className="px-1 py-1.5">
                      <input
                        value={row.rank}
                        onChange={(e) =>
                          updateRow(row.id, { rank: e.target.value })
                        }
                        className="h-8 w-12 rounded border border-border bg-white px-1 font-mono"
                      />
                    </td>
                    <td className="px-1 py-1.5 font-semibold">
                      {owner?.display_name ?? "—"}
                    </td>
                    <td className="px-1 py-1.5">
                      <input
                        value={row.team_name}
                        onChange={(e) =>
                          updateRow(row.id, { team_name: e.target.value })
                        }
                        className="h-8 w-28 rounded border border-border bg-white px-1 sm:w-36"
                      />
                    </td>
                    {(["wins", "losses", "ties"] as const).map((k) => (
                      <td key={k} className="px-1 py-1.5">
                        <input
                          value={row[k]}
                          onChange={(e) =>
                            updateRow(row.id, { [k]: e.target.value })
                          }
                          className="h-8 w-12 rounded border border-border bg-white px-1 font-mono"
                        />
                      </td>
                    ))}
                    {(["points_for", "points_against"] as const).map((k) => (
                      <td key={k} className="px-1 py-1.5">
                        <input
                          value={row[k]}
                          onChange={(e) =>
                            updateRow(row.id, { [k]: e.target.value })
                          }
                          className="h-8 w-16 rounded border border-border bg-white px-1 font-mono"
                        />
                      </td>
                    ))}
                    <td className="px-1 py-1.5 text-center">
                      <input
                        type="checkbox"
                        checked={row.is_champion}
                        onChange={(e) =>
                          updateRow(row.id, {
                            is_champion: e.target.checked,
                          })
                        }
                      />
                    </td>
                    <td className="px-1 py-1.5 text-center">
                      <input
                        type="checkbox"
                        checked={row.is_runner_up}
                        onChange={(e) =>
                          updateRow(row.id, {
                            is_runner_up: e.target.checked,
                          })
                        }
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Preview:{" "}
          {drafts
            .slice()
            .sort((a, b) => Number(a.rank) - Number(b.rank))
            .map((d) => {
              const o = owners.find((x) => x.id === d.owner_id);
              return `${d.rank}. ${o?.display_name ?? "?"} ${formatRecord(
                Number(d.wins) || 0,
                Number(d.losses) || 0,
                Number(d.ties) || 0
              )}`;
            })
            .join(" · ")}
        </p>
      </div>

      <ActionForm
        action={deletePastSeason}
        className="border-t border-border pt-3"
      >
        <input type="hidden" name="id" value={season.id} />
        <SubmitButton variant="outline">Delete season</SubmitButton>
      </ActionForm>
    </article>
  );
}
