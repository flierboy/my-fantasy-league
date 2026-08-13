"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import type { Owner } from "@/lib/types";
import { NFL_TEAM_OPTIONS, OWNER_ROLE_OPTIONS } from "@/lib/types";
import {
  bulkUpdateOwners,
  uploadOwnerAvatar,
  type BulkOwnerRow,
} from "@/lib/actions/admin/owners";
import type { ActionResult } from "@/lib/actions/admin/types";
import { Field, fieldInputClass } from "./field";
import { FormMessage } from "./form-message";
import { OwnerAvatar } from "@/components/home/owner-avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DraftOwner = {
  id: string;
  display_name: string;
  team_name: string;
  email: string;
  avatar_url: string;
  role: string;
  prize_money: string;
  favorite_nfl_team: string;
  sleeper_username: string;
  is_admin: boolean;
};

function toDraft(o: Owner): DraftOwner {
  return {
    id: o.id,
    display_name: o.display_name,
    team_name: o.team_name ?? "",
    email: o.email ?? "",
    avatar_url: o.avatar_url ?? "",
    role: o.role ?? "",
    prize_money: String(o.prize_money ?? 0),
    favorite_nfl_team: o.favorite_nfl_team ?? "",
    sleeper_username: o.sleeper_username ?? "",
    is_admin: o.is_admin,
  };
}

function draftsEqual(a: DraftOwner[], b: DraftOwner[]) {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Compact multi-owner editor for quick league setup (all 10 in one place).
 */
export function OwnersBulkEditor({ owners }: { owners: Owner[] }) {
  const initial = useMemo(
    () =>
      [...owners]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(toDraft),
    [owners]
  );
  const [drafts, setDrafts] = useState<DraftOwner[]>(initial);
  const [baseline, setBaseline] = useState<DraftOwner[]>(initial);
  const [saveResult, setSaveResult] = useState<ActionResult | null>(null);
  const [uploadMsg, setUploadMsg] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const dirty = !draftsEqual(drafts, baseline);

  const update = useCallback(
    (id: string, patch: Partial<DraftOwner>) => {
      setDrafts((prev) =>
        prev.map((row) => (row.id === id ? { ...row, ...patch } : row))
      );
      setSaveResult(null);
    },
    []
  );

  const saveAll = () => {
    startTransition(async () => {
      const payload: BulkOwnerRow[] = drafts.map((d) => ({
        id: d.id,
        display_name: d.display_name,
        team_name: d.team_name,
        email: d.email,
        avatar_url: d.avatar_url,
        role: d.role,
        prize_money: d.prize_money,
        favorite_nfl_team: d.favorite_nfl_team,
        sleeper_username: d.sleeper_username,
        is_admin: d.is_admin,
      }));
      const fd = new FormData();
      fd.set("payload", JSON.stringify(payload));
      const result = await bulkUpdateOwners(fd);
      setSaveResult(result);
      if (result.ok) {
        setBaseline(drafts.map((d) => ({ ...d })));
      }
    });
  };

  const onAvatarFile = (id: string, file: File | null) => {
    if (!file) return;
    setUploadingId(id);
    setUploadMsg((m) => ({ ...m, [id]: "" }));
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", id);
      fd.set("avatar", file);
      const result = await uploadOwnerAvatar(fd);
      if (result.ok) {
        const url = result.data?.avatar_url;
        if (url) {
          update(id, { avatar_url: url });
          // Baseline so Save all isn't forced just for avatar (already persisted)
          setBaseline((prev) =>
            prev.map((r) => (r.id === id ? { ...r, avatar_url: url } : r))
          );
        }
        setUploadMsg((m) => ({
          ...m,
          [id]: result.message ?? "Avatar uploaded",
        }));
      } else {
        setUploadMsg((m) => ({
          ...m,
          [id]: result.error ?? "Upload failed",
        }));
      }
      setUploadingId(null);
    });
  };

  const reset = () => {
    setDrafts(baseline.map((d) => ({ ...d })));
    setSaveResult(null);
  };

  return (
    <div className="space-y-4 pb-28">
      <div className="ff-card space-y-2 p-4 sm:p-5">
        <p className="text-sm text-muted-foreground">
          Edit every owner in one place, then <strong>Save all</strong>. Avatars:
          paste a public image URL in the row (included in Save all), or use{" "}
          <strong>Upload</strong> per row (goes to Supabase Storage immediately).
        </p>
        <ul className="list-inside list-disc text-xs text-muted-foreground">
          <li>
            <code className="font-mono text-[11px]">favorite_nfl_team</code> +{" "}
            <code className="font-mono text-[11px]">sleeper_username</code> need{" "}
            <code className="font-mono text-[11px]">
              supabase/migrate-owner-bulk-fields.sql
            </code>
          </li>
          <li>
            Sleeper username is used when matching rosters on Admin → Sleeper
          </li>
          <li>
            After save, public <code className="font-mono">/players</code>{" "}
            revalidates automatically
          </li>
        </ul>
      </div>

      <div className="space-y-3">
        {drafts.map((row, index) => (
          <article
            key={row.id}
            className="ff-card overflow-hidden p-3 sm:p-4"
          >
            <div className="mb-3 flex flex-wrap items-center gap-3 border-b border-border pb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-md border-2 border-foreground bg-muted font-mono text-xs font-bold">
                {index + 1}
              </span>
              <OwnerAvatar
                name={row.display_name || "?"}
                src={row.avatar_url || null}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <p className="ff-display truncate text-base">
                  {row.display_name || "Unnamed"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {row.team_name || "No team name"}
                  {row.favorite_nfl_team
                    ? ` · NFL: ${row.favorite_nfl_team}`
                    : ""}
                  {row.is_admin ? " · admin" : ""}
                </p>
              </div>
              <label className="inline-flex shrink-0 items-center gap-2 rounded-lg border-2 border-border bg-[#f4f2ef] px-2.5 py-1.5 text-xs font-bold">
                <input
                  type="checkbox"
                  checked={row.is_admin}
                  onChange={(e) =>
                    update(row.id, { is_admin: e.target.checked })
                  }
                  className="h-4 w-4 accent-foreground"
                />
                is_admin
              </label>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <Field label="Display name" htmlFor={`${row.id}-dn`}>
                <input
                  id={`${row.id}-dn`}
                  value={row.display_name}
                  onChange={(e) =>
                    update(row.id, { display_name: e.target.value })
                  }
                  className={fieldInputClass}
                  required
                />
              </Field>
              <Field label="Team name" htmlFor={`${row.id}-tn`}>
                <input
                  id={`${row.id}-tn`}
                  value={row.team_name}
                  onChange={(e) =>
                    update(row.id, { team_name: e.target.value })
                  }
                  className={fieldInputClass}
                />
              </Field>
              <Field label="Email" htmlFor={`${row.id}-em`}>
                <input
                  id={`${row.id}-em`}
                  type="email"
                  value={row.email}
                  onChange={(e) => update(row.id, { email: e.target.value })}
                  className={fieldInputClass}
                  placeholder="owner@email.com"
                />
              </Field>
              <Field label="Role" htmlFor={`${row.id}-role`}>
                <select
                  id={`${row.id}-role`}
                  value={row.role}
                  onChange={(e) => update(row.id, { role: e.target.value })}
                  className={fieldInputClass}
                >
                  {OWNER_ROLE_OPTIONS.map((r) => (
                    <option key={r || "none"} value={r}>
                      {r || "— None —"}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="Career cash ($)"
                htmlFor={`${row.id}-cash`}
                hint="Prize money chip"
              >
                <input
                  id={`${row.id}-cash`}
                  type="number"
                  min={0}
                  step="0.01"
                  value={row.prize_money}
                  onChange={(e) =>
                    update(row.id, { prize_money: e.target.value })
                  }
                  className={fieldInputClass}
                />
              </Field>
              <Field label="Favorite NFL team" htmlFor={`${row.id}-nfl`}>
                <select
                  id={`${row.id}-nfl`}
                  value={row.favorite_nfl_team}
                  onChange={(e) =>
                    update(row.id, { favorite_nfl_team: e.target.value })
                  }
                  className={fieldInputClass}
                >
                  {NFL_TEAM_OPTIONS.map((t) => (
                    <option key={t || "none"} value={t}>
                      {t || "— None —"}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="Sleeper username"
                htmlFor={`${row.id}-sl`}
                hint="Match helper for Sleeper sync"
              >
                <input
                  id={`${row.id}-sl`}
                  value={row.sleeper_username}
                  onChange={(e) =>
                    update(row.id, { sleeper_username: e.target.value })
                  }
                  className={fieldInputClass}
                  placeholder="sleeper display / username"
                />
              </Field>
              <Field
                label="Avatar URL"
                htmlFor={`${row.id}-av`}
                className="sm:col-span-2 lg:col-span-2"
                hint="Paste URL then Save all — or upload file below"
              >
                <input
                  id={`${row.id}-av`}
                  value={row.avatar_url}
                  onChange={(e) =>
                    update(row.id, { avatar_url: e.target.value })
                  }
                  className={fieldInputClass}
                  placeholder="https://…/photo.jpg"
                />
              </Field>
              <div className="flex flex-col justify-end gap-1.5 sm:col-span-2 lg:col-span-1">
                <label
                  className={cn(
                    "inline-flex h-10 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-[#f4f2ef] px-3 text-xs font-bold transition-colors hover:border-foreground hover:bg-white",
                    uploadingId === row.id && "opacity-60"
                  )}
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    disabled={pending || uploadingId === row.id}
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      onAvatarFile(row.id, f);
                      e.target.value = "";
                    }}
                  />
                  {uploadingId === row.id ? "Uploading…" : "Upload avatar"}
                </label>
                {uploadMsg[row.id] && (
                  <p className="text-[11px] text-muted-foreground">
                    {uploadMsg[row.id]}
                  </p>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Sticky save bar */}
      <div className="ff-sticky-bar fixed bottom-0 left-0 right-0 z-40 border-t-2 border-foreground bg-white px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.18)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {dirty ? "Unsaved changes" : "All changes saved"}
              {" · "}
              {drafts.length} owners
            </p>
            <FormMessage result={saveResult} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={reset}
              disabled={!dirty || pending}
            >
              Reset
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={saveAll}
              disabled={pending || !dirty}
            >
              {pending ? "Saving…" : "Save all owners"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
