"use client";

import { useState, useTransition } from "react";
import {
  syncSleeperLeague,
  type SleeperSyncSummary,
} from "@/lib/actions/admin/sleeper";
import { SLEEPER_DEFAULT_LEAGUE_ID } from "@/lib/sleeper/client";
import { Button } from "@/components/ui/button";
import { Field, fieldInputClass } from "./field";

export function SleeperSyncForm() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<SleeperSyncSummary | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setResult(null);
    startTransition(async () => {
      const summary = await syncSleeperLeague(fd);
      setResult(summary);
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="ff-card space-y-4 p-5 sm:p-6">
        <div>
          <h2 className="ff-display text-xl">Sync from Sleeper</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manual pull from the public Sleeper API (no login required). One
            click — not a live background sync.
          </p>
        </div>

        <Field label="Sleeper league ID" htmlFor="league_id">
          <input
            id="league_id"
            name="league_id"
            defaultValue={SLEEPER_DEFAULT_LEAGUE_ID}
            className={fieldInputClass + " font-mono text-xs"}
            required
          />
        </Field>

        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            name="update_records"
            defaultChecked
            className="h-4 w-4 accent-foreground"
          />
          Update W-L / standings on matched owners
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            name="create_missing"
            className="h-4 w-4 accent-foreground"
          />
          Create site owners for unmatched Sleeper users
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            name="update_league_name"
            className="h-4 w-4 accent-foreground"
          />
          Overwrite site league name with Sleeper league name
        </label>

        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Syncing from Sleeper…" : "Sync from Sleeper"}
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
            {result.ok ? "Sync complete" : "Sync failed"}
          </h3>
          {result.error && (
            <p className="mt-2 text-sm font-medium text-destructive">
              {result.error}
            </p>
          )}
          {result.ok && (
            <>
              <ul className="mt-3 space-y-1.5 text-sm">
                <li>
                  <strong>League:</strong> {result.leagueName} (
                  <code className="font-mono text-xs">{result.leagueId}</code>
                  )
                </li>
                <li>
                  <strong>Season / status:</strong> {result.season} ·{" "}
                  {result.status}
                </li>
                <li>
                  <strong>Users joined:</strong> {result.joinedUsers} · open
                  slots: {result.openRosterSlots}
                </li>
                <li>
                  <strong>Rosters:</strong> {result.teamsFound}
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
                  <strong>League name updated:</strong>{" "}
                  {result.settingsUpdated ? "yes" : "no"}
                </li>
              </ul>

              {result.teamPreview && result.teamPreview.length > 0 && (
                <div className="mt-4 overflow-x-auto">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Teams pulled
                  </p>
                  <table className="w-full min-w-[480px] text-left text-sm">
                    <thead className="border-b-2 border-foreground bg-[#f4f2ef] text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2">Team</th>
                        <th className="px-3 py-2">User</th>
                        <th className="px-3 py-2">W-L-T</th>
                        <th className="px-3 py-2">Match</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {result.teamPreview.map((t) => (
                        <tr key={t.teamName + (t.userDisplayName ?? "")}>
                          <td className="px-3 py-2 font-semibold">
                            {t.teamName}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {t.userDisplayName ?? "—"}
                          </td>
                          <td className="px-3 py-2 font-mono text-xs">
                            {t.record}
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            {t.matchedOwner ?? "unmatched"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
          {result.notes && result.notes.length > 0 && (
            <div className="mt-4 rounded-lg bg-[#f4f2ef] p-3 text-xs text-muted-foreground">
              <p className="font-bold uppercase tracking-wider">Notes</p>
              <ul className="mt-1 list-disc space-y-1 pl-4">
                {result.notes.map((n) => (
                  <li key={n.slice(0, 40)}>{n}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
