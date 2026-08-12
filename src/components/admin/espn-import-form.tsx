"use client";

import { useState, useTransition } from "react";
import {
  importEspnLeague,
  type EspnImportSummary,
} from "@/lib/actions/admin/import-espn";
import {
  ESPN_DEFAULT_LEAGUE_ID,
  ESPN_DEFAULT_SEASON,
} from "@/lib/espn/client";
import { Button } from "@/components/ui/button";
import { Field, fieldInputClass } from "./field";

export function EspnImportForm() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<EspnImportSummary | null>(null);
  const [showCookies, setShowCookies] = useState(true);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setResult(null);
    startTransition(async () => {
      const summary = await importEspnLeague(fd);
      setResult(summary);
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="ff-card space-y-5 p-5 sm:p-6">
        <div>
          <h2 className="ff-display text-xl">Import 2025 ESPN League</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            One-time historical import for league{" "}
            <code className="font-mono text-xs">{ESPN_DEFAULT_LEAGUE_ID}</code>.
            Season <strong>2025</strong> returns 401 without cookies — paste{" "}
            <code className="font-mono text-xs">espn_s2</code> +{" "}
            <code className="font-mono text-xs">SWID</code> below. Cookies are
            used for this request only (not saved).
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="League ID" htmlFor="league_id">
            <input
              id="league_id"
              name="league_id"
              defaultValue={ESPN_DEFAULT_LEAGUE_ID}
              className={fieldInputClass}
              required
            />
          </Field>
          <Field label="Season" htmlFor="season">
            <input
              id="season"
              name="season"
              type="number"
              defaultValue={ESPN_DEFAULT_SEASON}
              className={fieldInputClass}
              required
            />
          </Field>
        </div>

        {/* Cookies — prominent for private 2025 */}
        <div className="rounded-xl border-2 border-foreground bg-[#f4f2ef]/80 p-4">
          <button
            type="button"
            className="ff-display w-full text-left text-sm"
            onClick={() => setShowCookies((v) => !v)}
          >
            ESPN auth cookies (required for 2025)
            <span className="ml-2 font-sans text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {showCookies ? "hide" : "show"}
            </span>
          </button>

          {showCookies && (
            <div className="mt-4 space-y-3">
              <Field
                label="espn_s2"
                htmlFor="espn_s2"
                hint="Long token from browser cookies on espn.com / fantasy.espn.com"
              >
                <textarea
                  id="espn_s2"
                  name="espn_s2"
                  rows={3}
                  placeholder="AEBxxxxx… (paste full espn_s2 value)"
                  autoComplete="off"
                  spellCheck={false}
                  className={
                    fieldInputClass +
                    " min-h-[4.5rem] font-mono text-[11px] leading-snug"
                  }
                />
              </Field>
              <Field
                label="SWID"
                htmlFor="swid"
                hint='Looks like {A1B2C3D4-...} — braces optional'
              >
                <input
                  id="swid"
                  name="swid"
                  placeholder="{XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX}"
                  autoComplete="off"
                  spellCheck={false}
                  className={fieldInputClass + " font-mono text-xs"}
                />
              </Field>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                <strong className="text-foreground">How to copy:</strong> Log
                into{" "}
                <a
                  href="https://fantasy.espn.com"
                  className="underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  fantasy.espn.com
                </a>{" "}
                → open DevTools (F12 / ⌥⌘I) →{" "}
                <em>Application</em> (Chrome) or <em>Storage</em> (Firefox) →
                Cookies → select an <code className="font-mono">espn.com</code>{" "}
                domain → copy values for{" "}
                <code className="font-mono">espn_s2</code> and{" "}
                <code className="font-mono">SWID</code> → paste here → Import.
                Treat cookies like a password.
              </p>
            </div>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            name="create_missing"
            className="h-4 w-4 accent-foreground"
          />
          Create site owners for unmatched ESPN teams
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            name="import_matchups"
            defaultChecked
            className="h-4 w-4 accent-foreground"
          />
          Import completed weekly matchups (replaces that season’s matchups)
        </label>

        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Importing 2025 from ESPN…" : "Import 2025 ESPN League"}
        </Button>
      </form>

      {result && (
        <div
          role="status"
          className={
            result.ok
              ? "ff-card border-emerald-800/40 p-5"
              : "ff-card border-destructive/50 bg-red-50 p-5"
          }
        >
          <h3 className="ff-display text-lg">
            {result.ok ? "Import complete" : "Import failed"}
          </h3>
          {result.usedCookies != null && (
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Auth: {result.usedCookies ? "cookies sent" : "no cookies"}
            </p>
          )}
          {result.error && (
            <p className="mt-2 whitespace-pre-wrap text-sm font-medium text-destructive">
              {result.error}
            </p>
          )}
          {result.ok && (
            <ul className="mt-3 space-y-1.5 text-sm">
              <li>
                <strong>ESPN league:</strong> {result.espnLeagueName ?? "—"}{" "}
                (ID {result.leagueId}, season {result.season})
              </li>
              <li>
                <strong>Teams found:</strong> {result.teamsFound}
              </li>
              <li>
                <strong>Owners updated:</strong> {result.ownersUpdated}
              </li>
              <li>
                <strong>Owners created:</strong> {result.ownersCreated}
              </li>
              <li>
                <strong>Standings rows:</strong> {result.standingsUpserted}
              </li>
              <li>
                <strong>Matchups inserted:</strong> {result.matchupsInserted}
              </li>
              <li>
                <strong>Champion:</strong> {result.champion ?? "—"}
              </li>
              <li>
                <strong>Runner-up:</strong> {result.runnerUp ?? "—"}
              </li>
              {result.historyCreated && result.historyCreated.length > 0 && (
                <li>
                  <strong>History:</strong> {result.historyCreated.join("; ")}
                </li>
              )}
              {result.ownersUnmatched && result.ownersUnmatched.length > 0 && (
                <li className="text-amber-900">
                  <strong>Unmatched:</strong>{" "}
                  {result.ownersUnmatched.join(", ")}
                </li>
              )}
            </ul>
          )}
          {result.notes && result.notes.length > 0 && (
            <div className="mt-4 rounded-lg bg-[#f4f2ef] p-3 text-xs text-muted-foreground">
              <p className="font-bold uppercase tracking-wider">Notes</p>
              <ul className="mt-1 list-disc space-y-1 pl-4">
                {result.notes.map((n) => (
                  <li key={n.slice(0, 48)}>{n}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
