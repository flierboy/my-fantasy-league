"use client";

import { useState, useTransition } from "react";
import {
  evaluateWeeklyBadgesAction,
  sendWeeklyResultsEmail,
  syncSleeperLeague,
  type SleeperSyncSummary,
} from "@/lib/actions/admin/sleeper";
import type { ActionResult } from "@/lib/actions/admin/types";
import { resolveSleeperLeagueId } from "@/lib/sleeper/links";
import { Button } from "@/components/ui/button";
import { Field, fieldInputClass } from "./field";
import { FormMessage } from "./form-message";

export function SleeperSyncForm({
  autoAwardDefault = true,
  lastSyncAt = null,
  sleeperLeagueId = null,
}: {
  /** From league_settings.auto_award_weekly_badges */
  autoAwardDefault?: boolean;
  lastSyncAt?: string | null;
  /** From league_settings.sleeper_league_id */
  sleeperLeagueId?: string | null;
}) {
  const defaultLeagueId = resolveSleeperLeagueId(sleeperLeagueId);
  const [pending, startTransition] = useTransition();
  const [emailPending, startEmailTransition] = useTransition();
  const [badgePending, startBadgeTransition] = useTransition();
  const [result, setResult] = useState<SleeperSyncSummary | null>(null);
  const [emailResult, setEmailResult] = useState<ActionResult | null>(null);
  const [badgeResult, setBadgeResult] = useState<ActionResult | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setResult(null);
    startTransition(async () => {
      const summary = await syncSleeperLeague(fd);
      setResult(summary);
    });
  }

  function onWeeklyEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setEmailResult(null);
    startEmailTransition(async () => {
      const res = await sendWeeklyResultsEmail(fd);
      setEmailResult(res);
    });
  }

  function onBadgeEval(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBadgeResult(null);
    startBadgeTransition(async () => {
      const res = await evaluateWeeklyBadgesAction(fd);
      setBadgeResult(res);
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="ff-card space-y-4 p-5 sm:p-6">
        <div>
          <h2 className="ff-display text-xl">Sync from Sleeper</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pulls users/rosters, season standings, and weekly matchups for the
            target week. Public API — no Sleeper login.
          </p>
          {lastSyncAt && (
            <p className="mt-2 text-xs font-semibold text-muted-foreground">
              Last successful sync ·{" "}
              {new Date(lastSyncAt).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>

        <Field label="Sleeper league ID" htmlFor="league_id">
          <input
            id="league_id"
            name="league_id"
            defaultValue={defaultLeagueId}
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
          Update W-L / season standings (PF, PA, rank)
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            name="sync_matchups"
            defaultChecked
            className="h-4 w-4 accent-foreground"
          />
          Pull weekly matchups into site tables (replaces that week)
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

        <div className="rounded-lg border border-border bg-[#f4f2ef] p-3 space-y-3">
          <Field
            label="Week (optional)"
            htmlFor="weekly_week"
            hint="Blank = last completed NFL week. Used for matchups, badges, and email."
          >
            <input
              id="weekly_week"
              name="weekly_week"
              type="number"
              min={1}
              max={22}
              className={fieldInputClass}
              placeholder="e.g. 3"
            />
          </Field>
          <label className="flex items-start gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              name="auto_award_weekly_badges"
              value="on"
              defaultChecked={autoAwardDefault}
              className="mt-0.5 h-4 w-4 accent-foreground"
            />
            <span>
              Auto-award weekly badges after sync
              <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                Apex Predator, Blowout Machine, etc. Safe re-run (no duplicate
                same owner + badge + week).
              </span>
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              name="email_weekly_after_sync"
              className="mt-0.5 h-4 w-4 accent-foreground"
            />
            <span>
              Send weekly results email after sync
              <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                Requires RESEND_API_KEY + owner emails on file.
              </span>
            </span>
          </label>
        </div>

        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Syncing from Sleeper…" : "Sync from Sleeper"}
        </Button>
      </form>

      <form onSubmit={onWeeklyEmail} className="ff-card space-y-4 p-5 sm:p-6">
        <div>
          <h2 className="ff-display text-xl">Send weekly email</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Build a “Week X Results” email from Sleeper matchups, standings, and
            waivers (if any), then send to all owners with email on file.
          </p>
        </div>

        <Field label="Sleeper league ID" htmlFor="email_league_id">
          <input
            id="email_league_id"
            name="league_id"
            defaultValue={defaultLeagueId}
            className={fieldInputClass + " font-mono text-xs"}
            required
          />
        </Field>
        <Field
          label="Week (optional)"
          htmlFor="email_week"
          hint="Blank = auto (usually last completed week)"
        >
          <input
            id="email_week"
            name="week"
            type="number"
            min={1}
            max={22}
            className={fieldInputClass}
            placeholder="e.g. 3"
          />
        </Field>

        <Button
          type="submit"
          disabled={emailPending}
          variant="outline"
          className="w-full sm:w-auto"
        >
          {emailPending ? "Sending…" : "Send weekly email"}
        </Button>

        <FormMessage result={emailResult} />
      </form>

      <form onSubmit={onBadgeEval} className="ff-card space-y-4 p-5 sm:p-6">
        <div>
          <h2 className="ff-display text-xl">Re-run badge evaluation</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Evaluate weekly badges for a specific week from live Sleeper
            matchups. Safe to re-run — will not duplicate the same owner + badge
            + week.
          </p>
        </div>
        <Field label="Sleeper league ID" htmlFor="badge_league_id">
          <input
            id="badge_league_id"
            name="league_id"
            defaultValue={defaultLeagueId}
            className={fieldInputClass + " font-mono text-xs"}
            required
          />
        </Field>
        <Field
          label="Week (optional)"
          htmlFor="badge_week"
          hint="Blank = last completed NFL week"
        >
          <input
            id="badge_week"
            name="week"
            type="number"
            min={1}
            max={22}
            className={fieldInputClass}
            placeholder="e.g. 3"
          />
        </Field>
        <Button
          type="submit"
          disabled={badgePending}
          variant="outline"
          className="w-full sm:w-auto"
        >
          {badgePending ? "Evaluating…" : "Re-run badge evaluation"}
        </Button>
        <FormMessage result={badgeResult} />
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
                {result.syncedWeek != null && (
                  <li>
                    <strong>Synced week:</strong> {result.syncedWeek}
                    {result.matchupsWritten != null
                      ? ` · ${result.matchupsWritten} matchups`
                      : ""}
                  </li>
                )}
                {result.draftPicksWritten != null && (
                  <li>
                    <strong>Draft picks imported:</strong>{" "}
                    {result.draftPicksWritten}
                    {result.draftPicksWritten === 0
                      ? " (skipped if board already filled or draft_id missing)"
                      : " → /drafts"}
                  </li>
                )}
                <li>
                  <strong>League name updated:</strong>{" "}
                  {result.settingsUpdated ? "yes" : "no"}
                </li>
                {result.weeklyEmail && (
                  <li>
                    <strong>Weekly email:</strong> {result.weeklyEmail.message}
                    {result.weeklyEmail.week != null
                      ? ` (week ${result.weeklyEmail.week})`
                      : ""}
                  </li>
                )}
                {result.badgeAwards && (
                  <li>
                    <strong>Weekly badges:</strong> {result.badgeAwards.summary}
                  </li>
                )}
              </ul>
              {result.notes?.[0] && (
                <p className="mt-3 rounded-lg bg-[#f4f2ef] px-3 py-2 text-sm font-semibold">
                  {result.notes[0]}
                </p>
              )}

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
          {result.notes && result.notes.length > 1 && (
            <div className="mt-4 rounded-lg bg-[#f4f2ef] p-3 text-xs text-muted-foreground">
              <p className="font-bold uppercase tracking-wider">Notes</p>
              <ul className="mt-1 list-disc space-y-1 pl-4">
                {result.notes.slice(1).map((n) => (
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
