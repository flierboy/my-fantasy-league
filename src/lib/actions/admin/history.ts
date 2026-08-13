"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { historyRowPayload } from "@/lib/data/history";
import type { HistoryEntryType } from "@/lib/types";
import type { ActionResult } from "./types";
import { fail, ok } from "./types";
import { requireAdmin } from "./utils";
import { parseIntField } from "./parse";

const TYPES = new Set<HistoryEntryType>([
  "champion",
  "milestone",
  "record",
  "note",
]);

function revalidateHistory() {
  revalidatePath("/history");
  revalidatePath("/admin");
  revalidatePath("/admin/history");
  revalidatePath("/dashboard");
}

function parseType(raw: FormDataEntryValue | null): HistoryEntryType | null {
  const t = String(raw ?? "").trim() as HistoryEntryType;
  return TYPES.has(t) ? t : null;
}

function parseFields(formData: FormData) {
  const entry_type = parseType(formData.get("entry_type"));
  const year_label = String(formData.get("year_label") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const champion = String(formData.get("champion") ?? "").trim() || null;
  const runner_up = String(formData.get("runner_up") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const season = parseIntField(formData.get("season_year"), "Season year", {
    min: 1990,
    max: 2100,
    allowEmpty: true,
  });
  const sort = parseIntField(formData.get("sort_order"), "Sort order", {
    min: 0,
    allowEmpty: true,
  });

  return { entry_type, year_label, title, champion, runner_up, notes, season, sort };
}

function formatHistoryError(error: { message: string; code?: string }): string {
  // True missing relation only
  if (
    error.code === "42P01" ||
    /relation ["']?public\.history_entries["']? does not exist/i.test(
      error.message
    )
  ) {
    return "history_entries table missing — run supabase/migrate-history-entries.sql in the SQL Editor";
  }
  // Common mis-map (old code used entry_type; live DB uses record_type)
  if (
    /entry_type/i.test(error.message) &&
    /column|schema cache|could not find/i.test(error.message)
  ) {
    return `History column mismatch: ${error.message}. The app expects record_type on history_entries.`;
  }
  return error.message;
}

export async function createHistoryEntry(
  formData: FormData
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const f = parseFields(formData);
  if (!f.entry_type) return fail("Entry type is required");
  if (!f.year_label) return fail("Year / season label is required");
  if (!f.title && f.entry_type !== "champion") {
    return fail("Title is required");
  }
  if (f.entry_type === "champion" && !f.champion) {
    return fail("Champion name is required for champion entries");
  }
  if (f.season.error) return fail(f.season.error);
  if (f.sort.error) return fail(f.sort.error);

  const title =
    f.title ||
    (f.entry_type === "champion" ? `Season ${f.year_label} champion` : f.year_label);

  const supabase = await createClient();
  const { error } = await supabase.from("history_entries").insert(
    historyRowPayload({
      entry_type: f.entry_type,
      year_label: f.year_label,
      season_year: f.season.value,
      title,
      champion: f.champion,
      runner_up: f.runner_up,
      notes: f.notes,
      sort_order: f.sort.value ?? 0,
    })
  );

  if (error) return fail(formatHistoryError(error));

  revalidateHistory();
  return ok("History entry created");
}

export async function updateHistoryEntry(
  formData: FormData
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return fail("Entry id is required");

  const f = parseFields(formData);
  if (!f.entry_type) return fail("Entry type is required");
  if (!f.year_label) return fail("Year / season label is required");
  if (!f.title && f.entry_type !== "champion") {
    return fail("Title is required");
  }
  if (f.entry_type === "champion" && !f.champion) {
    return fail("Champion name is required for champion entries");
  }
  if (f.season.error) return fail(f.season.error);
  if (f.sort.error) return fail(f.sort.error);

  const title =
    f.title ||
    (f.entry_type === "champion" ? `Season ${f.year_label} champion` : f.year_label);

  const supabase = await createClient();
  const { error } = await supabase
    .from("history_entries")
    .update({
      ...historyRowPayload({
        entry_type: f.entry_type,
        year_label: f.year_label,
        season_year: f.season.value,
        title,
        champion: f.champion,
        runner_up: f.runner_up,
        notes: f.notes,
        sort_order: f.sort.value ?? 0,
      }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return fail(formatHistoryError(error));

  revalidateHistory();
  return ok("History entry updated");
}

export async function deleteHistoryEntry(
  formData: FormData
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return fail("Entry id is required");

  const supabase = await createClient();
  const { error } = await supabase.from("history_entries").delete().eq("id", id);
  if (error) return fail(formatHistoryError(error));

  revalidateHistory();
  return ok("History entry deleted");
}
