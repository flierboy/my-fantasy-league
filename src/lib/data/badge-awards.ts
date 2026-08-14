/**
 * Load weekly badge awards for profiles / hall of badges.
 */

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { BadgeKey } from "@/lib/types";
import { BADGE_KEYS } from "@/lib/data/badges";

export type BadgeAward = {
  id: string;
  owner_id: string;
  badge_key: BadgeKey;
  season_year: number;
  week: number;
  notes: string | null;
  created_at: string;
};

export async function getBadgeAwards(options?: {
  ownerId?: string;
  seasonYear?: number;
  week?: number;
  limit?: number;
}): Promise<{ awards: BadgeAward[]; source: "supabase" | "empty" | "error" }> {
  if (!isSupabaseConfigured()) {
    return { awards: [], source: "empty" };
  }

  try {
    const supabase = await createClient();
    let q = supabase
      .from("badge_awards")
      .select("id, owner_id, badge_key, season_year, week, notes, created_at")
      .order("season_year", { ascending: false })
      .order("week", { ascending: false })
      .limit(options?.limit ?? 500);

    if (options?.ownerId) q = q.eq("owner_id", options.ownerId);
    if (options?.seasonYear != null) q = q.eq("season_year", options.seasonYear);
    if (options?.week != null) q = q.eq("week", options.week);

    const { data, error } = await q;
    if (error) {
      console.error("[badge_awards]", error.message);
      return { awards: [], source: "error" };
    }

    const awards: BadgeAward[] = (data ?? [])
      .filter((r) => BADGE_KEYS.has(r.badge_key as BadgeKey))
      .map((r) => ({
        id: String(r.id),
        owner_id: String(r.owner_id),
        badge_key: r.badge_key as BadgeKey,
        season_year: Number(r.season_year),
        week: Number(r.week),
        notes: (r.notes as string | null) ?? null,
        created_at: String(r.created_at ?? ""),
      }));

    return { awards, source: "supabase" };
  } catch (err) {
    console.error("[badge_awards] unexpected", err);
    return { awards: [], source: "error" };
  }
}

/** Latest week label for a badge on an owner, e.g. "Week 3". */
export function latestWeekLabel(
  awards: BadgeAward[],
  ownerId: string,
  badgeKey: BadgeKey
): string | null {
  const mine = awards
    .filter((a) => a.owner_id === ownerId && a.badge_key === badgeKey)
    .sort((a, b) => b.season_year - a.season_year || b.week - a.week);
  if (!mine[0]) return null;
  return `Week ${mine[0].week}`;
}
