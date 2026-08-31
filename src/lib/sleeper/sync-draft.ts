/**
 * Import completed Sleeper draft picks into draft_years / draft_picks.
 * Only fills when the season board is empty (does not invent picks).
 */

import {
  fetchSleeperDraft,
  fetchSleeperDraftPicks,
  fetchSleeperLeagueDrafts,
  type SleeperDraftPick,
  type SleeperUser,
} from "@/lib/sleeper/client";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type DraftSyncResult = {
  seasonYear: number;
  draftId: string | null;
  picksWritten: number;
  skipped: boolean;
  notes: string[];
};

function playerNameFromPick(p: SleeperDraftPick): string {
  const meta = p.metadata ?? {};
  const first = (meta.first_name || "").trim();
  const last = (meta.last_name || "").trim();
  if (first || last) return [first, last].filter(Boolean).join(" ");
  const pid = (p.player_id || meta.player_id || "").trim();
  // Team DEF often uses abbr as id
  if (/^[A-Z]{2,3}$/.test(pid)) return pid;
  return pid || "Unknown";
}

function positionFromPick(p: SleeperDraftPick): string | null {
  const pos = (p.metadata?.position || "").trim();
  return pos || null;
}

function nflTeamFromPick(p: SleeperDraftPick): string | null {
  const team = (
    p.metadata?.team ||
    p.metadata?.team_abbr ||
    ""
  ).trim();
  if (team) return team.toUpperCase();
  const pid = (p.player_id || "").trim();
  if (/^[A-Z]{2,3}$/.test(pid)) return pid;
  return null;
}

/**
 * Import Sleeper draft for a season into public.draft_years / draft_picks.
 * @param onlyIfEmpty — when true (default), skip if picks already exist for that year
 */
export async function syncSleeperDraftPicks(opts: {
  supabase: Supabase;
  leagueId: string;
  /** Prefer league.draft_id from GET /league */
  draftId?: string | null;
  seasonYear: number;
  rosterToOwner: Map<number, string>;
  /** Sleeper user_id → display / team label */
  usersById?: Map<string, SleeperUser>;
  /** roster_id → fantasy team label */
  teamNameByRoster?: Map<number, string>;
  onlyIfEmpty?: boolean;
}): Promise<DraftSyncResult> {
  const notes: string[] = [];
  const onlyIfEmpty = opts.onlyIfEmpty !== false;
  const { supabase, leagueId, seasonYear, rosterToOwner } = opts;

  let draftId = (opts.draftId || "").trim() || null;

  if (!draftId) {
    try {
      const drafts = await fetchSleeperLeagueDrafts(leagueId);
      const match =
        drafts.find((d) => Number(d.season) === seasonYear) ?? drafts[0];
      draftId = match?.draft_id ?? null;
      if (draftId) {
        notes.push(`Resolved draft_id ${draftId} from league drafts list`);
      }
    } catch (err) {
      notes.push(
        `Could not list league drafts: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }

  if (!draftId) {
    return {
      seasonYear,
      draftId: null,
      picksWritten: 0,
      skipped: true,
      notes: [
        ...notes,
        "No Sleeper draft_id on league — set league.draft_id or finish the draft, then re-sync. Admin → Sleeper.",
      ],
    };
  }

  let draftStatus: string | undefined;
  try {
    const draft = await fetchSleeperDraft(draftId);
    draftStatus = draft.status;
    notes.push(`Sleeper draft ${draftId} · status=${draft.status ?? "?"}`);
  } catch (err) {
    notes.push(
      `Draft metadata fetch failed (continuing with picks): ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }

  let picks: SleeperDraftPick[] = [];
  try {
    picks = await fetchSleeperDraftPicks(draftId);
  } catch (err) {
    return {
      seasonYear,
      draftId,
      picksWritten: 0,
      skipped: true,
      notes: [
        ...notes,
        `Draft picks fetch failed: ${
          err instanceof Error ? err.message : String(err)
        }`,
      ],
    };
  }

  if (!picks.length) {
    return {
      seasonYear,
      draftId,
      picksWritten: 0,
      skipped: true,
      notes: [
        ...notes,
        draftStatus === "complete"
          ? "Draft complete but Sleeper returned 0 picks"
          : "No picks yet — draft may still be in progress",
      ],
    };
  }

  // Ensure draft_years row
  const { data: existingYear, error: yearErr } = await supabase
    .from("draft_years")
    .select("id")
    .eq("season_year", seasonYear)
    .maybeSingle();

  if (yearErr) {
    return {
      seasonYear,
      draftId,
      picksWritten: 0,
      skipped: true,
      notes: [
        ...notes,
        `${yearErr.message} — run supabase/migrate-draft-history.sql`,
      ],
    };
  }

  let draftYearId = existingYear?.id as string | undefined;

  if (!draftYearId) {
    const { data: created, error: createErr } = await supabase
      .from("draft_years")
      .insert({
        season_year: seasonYear,
        source: "sleeper",
        notes: `Imported from Sleeper draft ${draftId}`,
        sort_order: 0,
      })
      .select("id")
      .single();
    if (createErr || !created?.id) {
      return {
        seasonYear,
        draftId,
        picksWritten: 0,
        skipped: true,
        notes: [
          ...notes,
          `Could not create draft_years ${seasonYear}: ${createErr?.message ?? "unknown"}`,
        ],
      };
    }
    draftYearId = created.id as string;
    notes.push(`Created draft_years ${seasonYear}`);
  } else {
    // Keep source as sleeper when importing
    await supabase
      .from("draft_years")
      .update({
        source: "sleeper",
        notes: `Imported from Sleeper draft ${draftId}`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", draftYearId);
  }

  const { count: existingCount, error: countErr } = await supabase
    .from("draft_picks")
    .select("id", { count: "exact", head: true })
    .eq("draft_year_id", draftYearId);

  if (countErr) {
    notes.push(`Pick count check failed: ${countErr.message}`);
  }

  const alreadyHas = (existingCount ?? 0) > 0;
  if (onlyIfEmpty && alreadyHas) {
    return {
      seasonYear,
      draftId,
      picksWritten: 0,
      skipped: true,
      notes: [
        ...notes,
        `${seasonYear} draft already has ${existingCount} pick(s) — left unchanged`,
      ],
    };
  }

  if (alreadyHas && !onlyIfEmpty) {
    const { error: delErr } = await supabase
      .from("draft_picks")
      .delete()
      .eq("draft_year_id", draftYearId);
    if (delErr) {
      return {
        seasonYear,
        draftId,
        picksWritten: 0,
        skipped: true,
        notes: [...notes, `Could not clear old picks: ${delErr.message}`],
      };
    }
  }

  // pick_in_round = order within round by overall pick_no
  const sorted = [...picks].sort((a, b) => a.pick_no - b.pick_no);
  const inRoundCounter = new Map<number, number>();
  const usersById = opts.usersById ?? new Map();
  const teamNameByRoster = opts.teamNameByRoster ?? new Map();

  const rows = sorted.map((p) => {
    const round = Number(p.round) || 1;
    const next = (inRoundCounter.get(round) ?? 0) + 1;
    inRoundCounter.set(round, next);

    const rosterId = Number(p.roster_id);
    const ownerId =
      Number.isFinite(rosterId) && rosterId > 0
        ? rosterToOwner.get(rosterId) ?? null
        : null;

    const user = p.picked_by ? usersById.get(String(p.picked_by)) : undefined;
    const fantasyName =
      user?.metadata?.team_name?.trim() ||
      user?.display_name?.trim() ||
      (Number.isFinite(rosterId)
        ? teamNameByRoster.get(rosterId)
        : undefined) ||
      (Number.isFinite(rosterId) ? `Roster ${rosterId}` : "Unknown");

    return {
      draft_year_id: draftYearId,
      season_year: seasonYear,
      round,
      pick_in_round: next,
      overall_pick: Number(p.pick_no),
      player_name: playerNameFromPick(p),
      position: positionFromPick(p),
      nfl_team: nflTeamFromPick(p),
      fantasy_owner_name: fantasyName,
      owner_id: ownerId,
    };
  });

  // Insert in chunks to stay under payload limits
  const chunkSize = 50;
  let written = 0;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error: insErr } = await supabase.from("draft_picks").insert(chunk);
    if (insErr) {
      notes.push(`Pick insert failed at ${i}: ${insErr.message}`);
      break;
    }
    written += chunk.length;
  }

  const unmatched = rows.filter((r) => !r.owner_id).length;
  notes.push(
    `Wrote ${written} of ${rows.length} pick(s) for ${seasonYear} from Sleeper`
  );
  if (unmatched) {
    notes.push(
      `${unmatched} pick(s) missing owner link — check Sleeper roster matching`
    );
  }

  return {
    seasonYear,
    draftId,
    picksWritten: written,
    skipped: false,
    notes,
  };
}
