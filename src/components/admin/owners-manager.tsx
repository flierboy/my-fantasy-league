"use client";

import type { Owner } from "@/lib/types";
import { BADGE_LIST } from "@/lib/data/badges";
import {
  createOwner,
  updateOwner,
  unlinkOwnerUser,
  uploadOwnerAvatar,
} from "@/lib/actions/admin/owners";
import { ActionForm } from "./action-form";
import { SubmitButton } from "./submit-button";
import { Field, fieldInputClass } from "./field";
import { OwnerAvatar } from "@/components/home/owner-avatar";
import { formatRecord } from "@/lib/utils";

export function OwnersManager({ owners }: { owners: Owner[] }) {
  return (
    <div className="space-y-8">
      <section className="ff-card p-5 sm:p-6">
        <h2 className="ff-display text-xl">Add owner</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Creates a new franchise row. Link email + auth UUID after creating the
          login in Supabase Auth.
        </p>
        <ActionForm action={createOwner} className="mt-4">
          <OwnerFields />
          <SubmitButton>Add owner</SubmitButton>
        </ActionForm>
      </section>

      <section className="space-y-4">
        <h2 className="ff-display text-xl">Edit owners ({owners.length})</h2>
        {owners.map((owner) => (
          <article key={owner.id} className="ff-card p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <OwnerAvatar
                name={owner.display_name}
                src={owner.avatar_url}
                size="md"
              />
              <div>
                <p className="ff-display text-base">{owner.display_name}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {formatRecord(owner.wins, owner.losses, owner.ties)} · draft #
                  {owner.draft_slot ?? "—"}
                  {owner.is_admin ? " · admin" : ""}
                  {owner.user_id ? " · linked" : " · not linked"}
                  {owner.email ? ` · ${owner.email}` : ""}
                </p>
              </div>
            </div>

            {/* Avatar upload */}
            <div className="mb-4 rounded-lg border-2 border-dashed border-border bg-[#f4f2ef]/50 p-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Avatar / selfie upload
              </p>
              <ActionForm action={uploadOwnerAvatar}>
                <input type="hidden" name="id" value={owner.id} />
                <div className="flex flex-wrap items-end gap-3">
                  <Field label="Image file" htmlFor={`${owner.id}-avatar-file`}>
                    <input
                      id={`${owner.id}-avatar-file`}
                      name="avatar"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="block w-full max-w-xs text-xs file:mr-3 file:rounded-md file:border-2 file:border-foreground file:bg-white file:px-2 file:py-1 file:text-xs file:font-bold"
                    />
                  </Field>
                  <SubmitButton>Upload photo</SubmitButton>
                </div>
              </ActionForm>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Flow: create Supabase Auth user with their email → paste UUID
                below → upload selfie here (or paste a public image URL).
              </p>
            </div>

            <ActionForm action={updateOwner}>
              <input type="hidden" name="id" value={owner.id} />
              <OwnerFields owner={owner} />
              <div className="flex flex-wrap gap-2">
                <SubmitButton>Save changes</SubmitButton>
              </div>
            </ActionForm>

            {owner.user_id && (
              <ActionForm
                action={unlinkOwnerUser}
                className="mt-3 border-t border-border pt-3"
              >
                <input type="hidden" name="id" value={owner.id} />
                <p className="mb-2 break-all font-mono text-[11px] text-muted-foreground">
                  Linked user: {owner.user_id}
                </p>
                <SubmitButton variant="outline">Unlink user</SubmitButton>
              </ActionForm>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}

function OwnerFields({ owner }: { owner?: Owner }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="Display name" htmlFor={id(owner, "display_name")}>
        <input
          id={id(owner, "display_name")}
          name="display_name"
          required
          defaultValue={owner?.display_name ?? ""}
          className={fieldInputClass}
        />
      </Field>
      <Field label="Team name" htmlFor={id(owner, "team_name")}>
        <input
          id={id(owner, "team_name")}
          name="team_name"
          defaultValue={owner?.team_name ?? ""}
          className={fieldInputClass}
        />
      </Field>
      <Field
        label="Email"
        htmlFor={id(owner, "email")}
        hint="Same email used in Supabase Auth (for reference)"
      >
        <input
          id={id(owner, "email")}
          name="email"
          type="email"
          defaultValue={owner?.email ?? ""}
          placeholder="owner@email.com"
          className={fieldInputClass}
        />
      </Field>
      <Field label="Draft slot" htmlFor={id(owner, "draft_slot")} hint="1–20">
        <input
          id={id(owner, "draft_slot")}
          name="draft_slot"
          type="number"
          min={1}
          max={20}
          defaultValue={owner?.draft_slot ?? ""}
          className={fieldInputClass}
        />
      </Field>
      <Field label="Wins" htmlFor={id(owner, "wins")}>
        <input
          id={id(owner, "wins")}
          name="wins"
          type="number"
          min={0}
          required
          defaultValue={owner?.wins ?? 0}
          className={fieldInputClass}
        />
      </Field>
      <Field label="Losses" htmlFor={id(owner, "losses")}>
        <input
          id={id(owner, "losses")}
          name="losses"
          type="number"
          min={0}
          required
          defaultValue={owner?.losses ?? 0}
          className={fieldInputClass}
        />
      </Field>
      <Field label="Ties" htmlFor={id(owner, "ties")}>
        <input
          id={id(owner, "ties")}
          name="ties"
          type="number"
          min={0}
          defaultValue={owner?.ties ?? 0}
          className={fieldInputClass}
        />
      </Field>
      <Field label="Prize money ($)" htmlFor={id(owner, "prize_money")}>
        <input
          id={id(owner, "prize_money")}
          name="prize_money"
          type="number"
          min={0}
          step="0.01"
          required
          defaultValue={owner?.prize_money ?? 0}
          className={fieldInputClass}
        />
      </Field>
      <Field label="Sort order" htmlFor={id(owner, "sort_order")}>
        <input
          id={id(owner, "sort_order")}
          name="sort_order"
          type="number"
          min={0}
          defaultValue={owner?.sort_order ?? 0}
          className={fieldInputClass}
        />
      </Field>
      <Field
        label="Auth user_id"
        htmlFor={id(owner, "user_id")}
        hint="Supabase Auth → Users → copy UUID"
      >
        <input
          id={id(owner, "user_id")}
          name="user_id"
          defaultValue={owner?.user_id ?? ""}
          placeholder="uuid or empty"
          className={fieldInputClass + " font-mono text-xs"}
        />
      </Field>
      <Field
        label="Avatar URL"
        htmlFor={id(owner, "avatar_url")}
        className="sm:col-span-2"
        hint="Or use the photo upload above"
      >
        <input
          id={id(owner, "avatar_url")}
          name="avatar_url"
          defaultValue={owner?.avatar_url ?? ""}
          placeholder="https://… or leave blank"
          className={fieldInputClass}
        />
      </Field>

      <div className="sm:col-span-2 lg:col-span-3">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Badges
        </p>
        <div className="flex flex-wrap gap-2">
          {BADGE_LIST.map((b) => {
            const checked = owner?.badges.includes(b.key) ?? false;
            return (
              <label
                key={b.key}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border-2 border-border bg-[#f4f2ef] px-2.5 py-1 text-xs font-semibold has-[:checked]:border-foreground has-[:checked]:bg-white"
              >
                <input
                  type="checkbox"
                  name="badges"
                  value={b.key}
                  defaultChecked={checked}
                  className="accent-foreground"
                />
                <span>
                  {b.emoji} {b.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <label className="inline-flex items-center gap-2 text-sm font-semibold sm:col-span-2">
        <input
          type="checkbox"
          name="is_admin"
          defaultChecked={owner?.is_admin ?? false}
          className="h-4 w-4 accent-foreground"
        />
        Admin (full site edit access)
      </label>
    </div>
  );
}

function id(owner: Owner | undefined, field: string) {
  return owner ? `${owner.id}-${field}` : `new-${field}`;
}
