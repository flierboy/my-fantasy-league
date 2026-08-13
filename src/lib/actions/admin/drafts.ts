"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { matchOwnerId } from "@/lib/drafts/match-owner";
import type { DraftSource } from "@/lib/types";
import type { ActionResult } from "./types";
import { fail, ok } from "./types";
import { requireAdmin } from "./utils";
import { parseIntField } from "./parse";

const SOURCES = new Set<DraftSource>([
  "espn",
  "yahoo",
  "sleeper",
  "manual",
]);

function revalidateDrafts() {
  revalidatePath("/drafts");
  revalidatePath("/history");
  revalidatePath("/admin");
  revalidatePath("/admin/drafts");
  revalidatePath("/players");
}

function formatDbError(error: { message: string; code?: string }): string {
  if (error.code === "42P01" || /does not exist/i.test(error.message)) {
    return `${error.message} — run supabase/migrate-draft-history.sql`;
  }
  return error.message;
}

export async function createDraftYear(
  formData: FormData
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const year = parseIntField(formData.get("season_year"), "Season year", {
    min: 1990,
    max: 2100,
  });
  if (year.error || year.value == null) {
    return fail(year.error ?? "Year required");
  }

  const sourceRaw = String(formData.get("source") ?? "manual").trim();
  const source = SOURCES.has(sourceRaw as DraftSource)
    ? (sourceRaw as DraftSource)
    : "manual";
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase.from("draft_years").insert({
    season_year: year.value,
    source,
    notes,
    sort_order: 0,
  });

  if (error) return fail(formatDbError(error));
  revalidateDrafts();
  return ok(`Draft year ${year.value} created`);
}

export async function updateDraftYear(
  formData: FormData
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return fail("Id required");

  const year = parseIntField(formData.get("season_year"), "Season year", {
    min: 1990,
    max: 2100,
  });
  if (year.error || year.value == null) {
    return fail(year.error ?? "Year required");
  }

  const sourceRaw = String(formData.get("source") ?? "manual").trim();
  const source = SOURCES.has(sourceRaw as DraftSource)
    ? (sourceRaw as DraftSource)
    : "manual";
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("draft_years")
    .update({
      season_year: year.value,
      source,
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return fail(formatDbError(error));

  // Keep picks.season_year in sync
  await supabase
    .from("draft_picks")
    .update({ season_year: year.value })
    .eq("draft_year_id", id);

  revalidateDrafts();
  return ok("Draft year updated");
}

export async function deleteDraftYear(
  formData: FormData
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return fail("Id required");

  const supabase = await createClient();
  const { error } = await supabase.from("draft_years").delete().eq("id", id);
  if (error) return fail(formatDbError(error));

  revalidateDrafts();
  return ok("Draft year deleted");
}

export async function upsertDraftPick(
  formData: FormData
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const id = String(formData.get("id") ?? "").trim();
  const draft_year_id = String(formData.get("draft_year_id") ?? "").trim();
  if (!draft_year_id) return fail("Draft year required");

  const season_year = parseIntField(
    formData.get("season_year"),
    "Season year",
    { min: 1990, max: 2100 }
  );
  const round = parseIntField(formData.get("round"), "Round", { min: 1 });
  const pick_in_round = parseIntField(
    formData.get("pick_in_round"),
    "Pick in round",
    { min: 1 }
  );
  const overall_pick = parseIntField(
    formData.get("overall_pick"),
    "Overall pick",
    { min: 1 }
  );
  if (season_year.error || season_year.value == null)
    return fail(season_year.error ?? "Year required");
  if (round.error || round.value == null) return fail(round.error ?? "Round");
  if (pick_in_round.error || pick_in_round.value == null)
    return fail(pick_in_round.error ?? "Pick");
  if (overall_pick.error || overall_pick.value == null)
    return fail(overall_pick.error ?? "Overall");

  const player_name = String(formData.get("player_name") ?? "").trim();
  if (!player_name) return fail("Player name required");

  const position = String(formData.get("position") ?? "").trim() || null;
  const nfl_team = String(formData.get("nfl_team") ?? "").trim() || null;
  const fantasy_owner_name = String(
    formData.get("fantasy_owner_name") ?? ""
  ).trim();
  let owner_id = String(formData.get("owner_id") ?? "").trim() || null;

  const supabase = await createClient();

  if (!owner_id && fantasy_owner_name) {
    const { data: owners } = await supabase
      .from("owners")
      .select("id, display_name, team_name, sleeper_username");
    owner_id = matchOwnerId(fantasy_owner_name, owners ?? []);
  }

  const payload = {
    draft_year_id,
    season_year: season_year.value,
    round: round.value,
    pick_in_round: pick_in_round.value,
    overall_pick: overall_pick.value,
    player_name,
    position,
    nfl_team,
    fantasy_owner_name,
    owner_id,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { error } = await supabase
      .from("draft_picks")
      .update(payload)
      .eq("id", id);
    if (error) return fail(formatDbError(error));
    revalidateDrafts();
    return ok("Pick updated");
  }

  const { error } = await supabase.from("draft_picks").insert(payload);
  if (error) return fail(formatDbError(error));
  revalidateDrafts();
  return ok("Pick added");
}

export async function deleteDraftPick(
  formData: FormData
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return fail("Id required");

  const supabase = await createClient();
  const { error } = await supabase.from("draft_picks").delete().eq("id", id);
  if (error) return fail(formatDbError(error));

  revalidateDrafts();
  return ok("Pick deleted");
}

export type BulkPickInput = {
  round: number;
  pick_in_round: number;
  overall_pick: number;
  player_name: string;
  position?: string | null;
  nfl_team?: string | null;
  fantasy_owner_name: string;
};

/**
 * Bulk import picks for a draft year.
 * Form fields: draft_year_id, replace (on/off), payload (JSON array of BulkPickInput)
 * Also accepts CSV in `csv` field:
 * round,pick_in_round,overall_pick,player_name,position,nfl_team,fantasy_owner_name
 */
export async function bulkImportDraftPicks(
  formData: FormData
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const draft_year_id = String(formData.get("draft_year_id") ?? "").trim();
  if (!draft_year_id) return fail("Draft year required");

  const replace = formData.get("replace") === "on";
  let picks: BulkPickInput[] = [];

  const csv = String(formData.get("csv") ?? "").trim();
  const rawJson = String(formData.get("payload") ?? "").trim();

  if (csv) {
    picks = parseDraftCsv(csv);
  } else if (rawJson) {
    try {
      picks = JSON.parse(rawJson) as BulkPickInput[];
    } catch {
      return fail("Invalid JSON payload");
    }
  } else {
    return fail("Provide CSV or JSON payload");
  }

  if (!Array.isArray(picks) || picks.length === 0) {
    return fail("No picks found to import");
  }

  const supabase = await createClient();
  const { data: year, error: yErr } = await supabase
    .from("draft_years")
    .select("id, season_year")
    .eq("id", draft_year_id)
    .maybeSingle();

  if (yErr) return fail(formatDbError(yErr));
  if (!year) return fail("Draft year not found");

  const season_year = Number(year.season_year);
  const { data: owners } = await supabase
    .from("owners")
    .select("id, display_name, team_name, sleeper_username");

  if (replace) {
    const { error } = await supabase
      .from("draft_picks")
      .delete()
      .eq("draft_year_id", draft_year_id);
    if (error) return fail(formatDbError(error));
  }

  const rows = picks.map((p) => {
    const fantasy_owner_name = String(p.fantasy_owner_name ?? "").trim();
    const owner_id = fantasy_owner_name
      ? matchOwnerId(fantasy_owner_name, owners ?? [])
      : null;
    return {
      draft_year_id,
      season_year,
      round: Number(p.round),
      pick_in_round: Number(p.pick_in_round),
      overall_pick: Number(p.overall_pick),
      player_name: String(p.player_name ?? "").trim(),
      position: p.position ? String(p.position).trim() : null,
      nfl_team: p.nfl_team ? String(p.nfl_team).trim() : null,
      fantasy_owner_name,
      owner_id,
    };
  });

  // Validate
  for (const r of rows) {
    if (!r.player_name) return fail("Every pick needs a player_name");
    if (!Number.isFinite(r.round) || r.round < 1)
      return fail("Invalid round in import");
    if (!Number.isFinite(r.overall_pick) || r.overall_pick < 1)
      return fail("Invalid overall_pick in import");
  }

  // Insert in chunks
  const chunkSize = 50;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from("draft_picks").upsert(chunk, {
      onConflict: "draft_year_id,overall_pick",
    });
    if (error) return fail(formatDbError(error));
    inserted += chunk.length;
  }

  const matched = rows.filter((r) => r.owner_id).length;
  revalidateDrafts();
  return ok(
    `Imported ${inserted} picks for ${season_year} (${matched} matched to owners)`
  );
}

function parseDraftCsv(csv: string): BulkPickInput[] {
  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const header = lines[0].toLowerCase();
  const hasHeader =
    header.includes("round") ||
    header.includes("player") ||
    header.includes("overall");
  const dataLines = hasHeader ? lines.slice(1) : lines;

  const picks: BulkPickInput[] = [];
  for (const line of dataLines) {
    const cols = splitCsvLine(line);
    if (cols.length < 4) continue;

    // Flexible: round,pick_in_round,overall,player,pos,nfl,owner
    // or overall,round,pick,player,pos,team,owner
    let round = Number(cols[0]);
    let pick_in_round = Number(cols[1]);
    let overall_pick = Number(cols[2]);
    let player_name = cols[3];
    let position = cols[4] ?? null;
    let nfl_team = cols[5] ?? null;
    let fantasy_owner_name = cols[6] ?? "";

    // If first col looks like overall (and round is missing), swap heuristics
    if (
      hasHeader &&
      header.startsWith("overall")
    ) {
      overall_pick = Number(cols[0]);
      round = Number(cols[1]);
      pick_in_round = Number(cols[2]);
      player_name = cols[3];
      position = cols[4] ?? null;
      nfl_team = cols[5] ?? null;
      fantasy_owner_name = cols[6] ?? "";
    }

    if (!player_name) continue;
    if (!Number.isFinite(overall_pick)) continue;
    if (!Number.isFinite(round)) {
      // derive round for 10-team if only overall given
      round = Math.floor((overall_pick - 1) / 10) + 1;
      pick_in_round = ((overall_pick - 1) % 10) + 1;
    }
    if (!Number.isFinite(pick_in_round)) {
      pick_in_round = ((overall_pick - 1) % 10) + 1;
    }

    picks.push({
      round,
      pick_in_round,
      overall_pick,
      player_name: player_name.trim(),
      position: position?.trim() || null,
      nfl_team: nfl_team?.trim() || null,
      fantasy_owner_name: (fantasy_owner_name || "").trim(),
    });
  }
  return picks;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQ = !inQ;
      continue;
    }
    if (c === "," && !inQ) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += c;
  }
  out.push(cur.trim());
  return out;
}
