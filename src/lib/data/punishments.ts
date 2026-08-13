/**
 * Punishments / Wall of Shame.
 */

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { mapOwner } from "@/lib/data/mappers";
import type { Owner, Punishment } from "@/lib/types";

export function mapPunishment(
  row: Record<string, unknown>,
  ownersById: Map<string, Owner>
): Punishment {
  const ownerId =
    row.owner_id == null || row.owner_id === ""
      ? null
      : String(row.owner_id);
  return {
    id: String(row.id),
    season_year: Number(row.season_year),
    owner_id: ownerId,
    owner_label: (row.owner_label as string | null) ?? null,
    title: String(row.title ?? "Punishment"),
    description: String(row.description ?? ""),
    photo_url: (row.photo_url as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    sort_order: Number(row.sort_order ?? 0),
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
    owner: ownerId ? ownersById.get(ownerId) ?? null : null,
  };
}

export async function getPunishments(options?: {
  ownerId?: string;
}): Promise<{
  punishments: Punishment[];
  source: "supabase" | "empty" | "error";
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { punishments: [], source: "empty" };
  }

  try {
    const supabase = await createClient();
    let query = supabase
      .from("punishments")
      .select("*")
      .order("season_year", { ascending: false })
      .order("sort_order", { ascending: true });

    if (options?.ownerId) {
      query = query.eq("owner_id", options.ownerId);
    }

    const [punRes, ownersRes] = await Promise.all([
      query,
      supabase.from("owners").select("*"),
    ]);

    if (punRes.error) {
      console.error("[punishments]", punRes.error.message);
      return {
        punishments: [],
        source: "error",
        error: punRes.error.message,
      };
    }

    const ownersById = new Map(
      (ownersRes.data ?? []).map((r) => {
        const o = mapOwner(r as Record<string, unknown>);
        return [o.id, o] as const;
      })
    );

    const rows = punRes.data ?? [];
    if (rows.length === 0) {
      return { punishments: [], source: "empty" };
    }

    return {
      punishments: rows.map((r) =>
        mapPunishment(r as Record<string, unknown>, ownersById)
      ),
      source: "supabase",
    };
  } catch (err) {
    console.error("[punishments] unexpected:", err);
    return {
      punishments: [],
      source: "error",
      error: err instanceof Error ? err.message : "Unexpected error",
    };
  }
}
