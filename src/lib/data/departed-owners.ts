/**
 * Wall of the Dead — departed owners.
 */

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { DepartedOwner } from "@/lib/types";

export function mapDepartedOwner(row: Record<string, unknown>): DepartedOwner {
  return {
    id: String(row.id),
    display_name: String(row.display_name ?? ""),
    departed_year: Number(row.departed_year),
    epitaph: String(row.epitaph ?? ""),
    sort_order: Number(row.sort_order ?? 0),
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

export async function getDepartedOwners(): Promise<{
  departed: DepartedOwner[];
  source: "supabase" | "empty" | "error";
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { departed: [], source: "empty" };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("departed_owners")
      .select("*")
      .order("departed_year", { ascending: false })
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("[departed_owners]", error.message);
      return {
        departed: [],
        source: "error",
        error: error.message,
      };
    }

    const rows = data ?? [];
    if (rows.length === 0) {
      return { departed: [], source: "empty" };
    }

    return {
      departed: rows.map((r) => mapDepartedOwner(r as Record<string, unknown>)),
      source: "supabase",
    };
  } catch (err) {
    console.error("[departed_owners] unexpected:", err);
    return {
      departed: [],
      source: "error",
      error: err instanceof Error ? err.message : "Unexpected error",
    };
  }
}

/** Group departed owners by year, newest year first. */
export function groupDepartedByYear(
  departed: DepartedOwner[]
): { year: number; owners: DepartedOwner[] }[] {
  const map = new Map<number, DepartedOwner[]>();
  for (const d of departed) {
    const list = map.get(d.departed_year) ?? [];
    list.push(d);
    map.set(d.departed_year, list);
  }
  return [...map.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, owners]) => ({
      year,
      owners: [...owners].sort((a, b) => a.sort_order - b.sort_order),
    }));
}
