"use client";

import type { DuePayment, LeagueSettings } from "@/lib/types";
import { markAllDuesPaid, upsertDuePayment } from "@/lib/actions/admin/dues";
import { ActionForm } from "./action-form";
import { SubmitButton } from "./submit-button";
import { Field, fieldInputClass } from "./field";
import { formatMoney } from "@/lib/utils";
import { OwnerAvatar } from "@/components/home/owner-avatar";

export function DuesManager({
  league,
  payments,
  season,
}: {
  league: LeagueSettings;
  payments: DuePayment[];
  season: number;
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border-2 border-foreground bg-white p-5 shadow-sm">
        <h2 className="ff-display text-xl">Bulk actions</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Default dues: {formatMoney(league.dues_amount)} · season {season}
        </p>
        <ActionForm action={markAllDuesPaid} className="mt-4">
          <input type="hidden" name="season" value={season} />
          <input type="hidden" name="amount_due" value={league.dues_amount} />
          <SubmitButton>Mark everyone paid (full dues)</SubmitButton>
        </ActionForm>
      </section>

      <section className="space-y-4">
        <h2 className="ff-display text-xl">Per-owner dues</h2>
        {payments.map((row) => {
          const name = row.owner?.display_name ?? "Unknown";
          const paid =
            row.amount_paid >= row.amount_due && row.amount_due > 0;
          return (
            <article
              key={row.id}
              className="rounded-xl border-2 border-foreground bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="mb-3 flex items-center gap-2">
                <OwnerAvatar name={name} size="sm" />
                <div>
                  <p className="ff-display text-sm">{name}</p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {paid ? "Paid" : "Owes"}
                  </p>
                </div>
              </div>

              <ActionForm action={upsertDuePayment}>
                <input type="hidden" name="id" value={row.id} />
                <input type="hidden" name="owner_id" value={row.owner_id} />
                <input type="hidden" name="season" value={season} />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Amount due">
                    <input
                      name="amount_due"
                      type="number"
                      min={0}
                      step="0.01"
                      required
                      defaultValue={row.amount_due || league.dues_amount}
                      className={fieldInputClass}
                    />
                  </Field>
                  <Field label="Amount paid">
                    <input
                      name="amount_paid"
                      type="number"
                      min={0}
                      step="0.01"
                      required
                      defaultValue={row.amount_paid}
                      className={fieldInputClass}
                    />
                  </Field>
                  <Field label="Notes" className="sm:col-span-2">
                    <input
                      name="notes"
                      defaultValue={row.notes ?? ""}
                      className={fieldInputClass}
                      placeholder="Venmo, cash, etc."
                    />
                  </Field>
                </div>
                <label className="inline-flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    name="mark_paid"
                    defaultChecked={paid}
                    className="h-4 w-4 accent-foreground"
                  />
                  Mark fully paid (sets paid = due)
                </label>
                <SubmitButton>Save</SubmitButton>
              </ActionForm>
            </article>
          );
        })}
      </section>
    </div>
  );
}
