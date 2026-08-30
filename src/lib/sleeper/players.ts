/**
 * Sleeper /players/nfl cache — resolve player ids to name / pos / team.
 * Do not call more than ~once per day (Sleeper guidance).
 */

import type { SleeperNflPlayer } from "@/lib/sleeper/client";

const BASE = "https://api.sleeper.app/v1";
const TTL_MS = 24 * 60 * 60 * 1000;

type CacheBag = {
  fetchedAt: number;
  byId: Map<string, SleeperNflPlayer>;
};

let memoryCache: CacheBag | null = null;

export async function getSleeperNflPlayersMap(
  forceRefresh = false
): Promise<Map<string, SleeperNflPlayer>> {
  if (
    !forceRefresh &&
    memoryCache &&
    Date.now() - memoryCache.fetchedAt < TTL_MS
  ) {
    return memoryCache.byId;
  }

  const res = await fetch(`${BASE}/players/nfl`, {
    headers: { Accept: "application/json" },
    // Next.js data cache — safe to revalidate daily
    next: { revalidate: 86400 },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Sleeper players/nfl ${res.status}${text ? `: ${text.slice(0, 200)}` : ""}`
    );
  }

  const data = (await res.json()) as Record<string, SleeperNflPlayer>;
  const byId = new Map<string, SleeperNflPlayer>();
  for (const [id, player] of Object.entries(data)) {
    byId.set(id, { ...player, player_id: player.player_id ?? id });
  }

  memoryCache = { fetchedAt: Date.now(), byId };
  return byId;
}

/** "J. Chase" style short name; DEF → team abbr. */
export function formatSleeperPlayerShortName(
  player: SleeperNflPlayer | undefined,
  playerId: string
): string {
  if (!player) {
    // Team defenses often use the abbr as the id (e.g. "CIN")
    if (/^[A-Z]{2,3}$/.test(playerId)) return playerId;
    return "";
  }

  const pos = (player.position ?? "").toUpperCase();
  if (pos === "DEF" || pos === "DST") {
    return (player.team || playerId || "DEF").toUpperCase();
  }

  const last = (player.last_name || "").trim();
  const first = (player.first_name || "").trim();
  if (last && first) return `${first[0].toUpperCase()}. ${last}`;
  if (last) return last;
  if (player.full_name) return player.full_name;
  return "";
}

/** Display string used for debugging / labels: "J. Chase WR CIN" */
export function formatSleeperPlayerLabel(
  player: SleeperNflPlayer | undefined,
  playerId: string
): string {
  const name = formatSleeperPlayerShortName(player, playerId);
  const pos = (player?.position || ( /^[A-Z]{2,3}$/.test(playerId) ? "DEF" : "")).toUpperCase();
  const team = (player?.team || ( /^[A-Z]{2,3}$/.test(playerId) ? playerId : "")).toUpperCase();
  return [name, pos, team].filter(Boolean).join(" ");
}
