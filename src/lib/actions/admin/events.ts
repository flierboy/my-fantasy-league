"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "./types";
import { fail, ok } from "./types";
import { requireAdmin } from "./utils";

function revalidateEvents() {
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  revalidatePath("/admin/events");
}

function formatDbError(error: { message: string; code?: string }): string {
  if (error.code === "42P01" || /does not exist/i.test(error.message)) {
    return `${error.message} — run supabase/migrate-league-events.sql`;
  }
  return error.message;
}

/** datetime-local value → ISO timestamptz (browser local → UTC). */
function parseStartsAt(raw: string): { value: string | null; error?: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { value: null, error: "Start date/time is required" };
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) {
    return { value: null, error: "Invalid start date/time" };
  }
  return { value: d.toISOString() };
}

export async function createLeagueEvent(
  formData: FormData
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return fail("Title is required");

  const starts = parseStartsAt(String(formData.get("starts_at") ?? ""));
  if (starts.error || !starts.value) {
    return fail(starts.error ?? "Start required");
  }

  const location = String(formData.get("location") ?? "").trim() || null;
  const kind = String(formData.get("kind") ?? "").trim() || "event";

  const supabase = await createClient();
  const { error } = await supabase.from("league_events").insert({
    title,
    starts_at: starts.value,
    location,
    kind,
  });

  if (error) return fail(formatDbError(error));
  revalidateEvents();
  return ok("Event created");
}

export async function updateLeagueEvent(
  formData: FormData
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return fail("Id required");

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return fail("Title is required");

  const starts = parseStartsAt(String(formData.get("starts_at") ?? ""));
  if (starts.error || !starts.value) {
    return fail(starts.error ?? "Start required");
  }

  const location = String(formData.get("location") ?? "").trim() || null;
  const kind = String(formData.get("kind") ?? "").trim() || "event";

  const supabase = await createClient();
  const { error } = await supabase
    .from("league_events")
    .update({
      title,
      starts_at: starts.value,
      location,
      kind,
    })
    .eq("id", id);

  if (error) return fail(formatDbError(error));
  revalidateEvents();
  return ok("Event updated");
}

export async function deleteLeagueEvent(
  formData: FormData
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return fail("Id required");

  const supabase = await createClient();
  const { error } = await supabase.from("league_events").delete().eq("id", id);
  if (error) return fail(formatDbError(error));

  revalidateEvents();
  return ok("Event deleted");
}
