"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "./types";
import { fail, ok } from "./types";
import { requireAdmin } from "./utils";
import { parseIntField, parseNumberField } from "./parse";

function revalidateDues() {
  revalidatePath("/dues");
  revalidatePath("/admin/dues");
  revalidatePath("/dashboard");
}

export async function upsertDuePayment(
  formData: FormData
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const id = String(formData.get("id") ?? "").trim();
  const owner_id = String(formData.get("owner_id") ?? "").trim();
  if (!owner_id) return fail("Owner is required");

  const season = parseIntField(formData.get("season"), "Season", {
    min: 2000,
    max: 2100,
  });
  if (season.error) return fail(season.error);

  const amount_due = parseNumberField(
    formData.get("amount_due"),
    "Amount due",
    { min: 0 }
  );
  if (amount_due.error) return fail(amount_due.error);

  const amount_paid = parseNumberField(
    formData.get("amount_paid"),
    "Amount paid",
    { min: 0 }
  );
  if (amount_paid.error) return fail(amount_paid.error);

  const notes = String(formData.get("notes") ?? "").trim() || null;
  const mark_paid = formData.get("mark_paid") === "on";

  let paid_amount = amount_paid.value ?? 0;
  let paid_at: string | null = String(formData.get("paid_at") ?? "").trim() || null;

  if (mark_paid) {
    paid_amount = amount_due.value ?? paid_amount;
    if (!paid_at) paid_at = new Date().toISOString();
  } else if (paid_amount <= 0) {
    paid_at = null;
  }

  const supabase = await createClient();

  // Synthetic pending ids from UI are not real UUIDs
  const isRealId =
    id &&
    !id.startsWith("pending-") &&
    /^[0-9a-f-]{36}$/i.test(id);

  if (isRealId) {
    const { error } = await supabase
      .from("due_payments")
      .update({
        amount_due: amount_due.value,
        amount_paid: paid_amount,
        paid_at,
        notes,
      })
      .eq("id", id);
    if (error) return fail(error.message);
  } else {
    const { error } = await supabase.from("due_payments").upsert(
      {
        owner_id,
        season: season.value,
        amount_due: amount_due.value,
        amount_paid: paid_amount,
        paid_at,
        notes,
      },
      { onConflict: "owner_id,season" }
    );
    if (error) return fail(error.message);
  }

  revalidateDues();
  return ok("Dues updated");
}

export async function markAllDuesPaid(formData: FormData): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const season = parseIntField(formData.get("season"), "Season", {
    min: 2000,
    max: 2100,
  });
  if (season.error) return fail(season.error);

  const amount = parseNumberField(formData.get("amount_due"), "Amount due", {
    min: 0,
  });
  if (amount.error) return fail(amount.error);

  const supabase = await createClient();
  const { data: owners, error: ownersErr } = await supabase
    .from("owners")
    .select("id");
  if (ownersErr) return fail(ownersErr.message);

  const now = new Date().toISOString();
  const rows = (owners ?? []).map((o) => ({
    owner_id: o.id as string,
    season: season.value!,
    amount_due: amount.value!,
    amount_paid: amount.value!,
    paid_at: now,
  }));

  const { error } = await supabase
    .from("due_payments")
    .upsert(rows, { onConflict: "owner_id,season" });
  if (error) return fail(error.message);

  revalidateDues();
  return ok("All owners marked paid");
}
