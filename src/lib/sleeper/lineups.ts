/**
 * Build persisted lineup rows from a Sleeper weekly matchup entry.
 */

import type { LineupPlayer } from "@/lib/types";
import type { SleeperMatchup, SleeperNflPlayer } from "@/lib/sleeper/client";
import { formatSleeperPlayerShortName } from "@/lib/sleeper/players";

const NON_STARTER_SLOTS = new Set([
  "BN",
  "IR",
  "TAX",
  "TAXI",
  "RESERVE",
  "RSV",
]);

/** Empty / missing starter sentinel from Sleeper. */
function isEmptyPlayerId(id: string | null | undefined): boolean {
  if (id == null) return true;
  const t = String(id).trim();
  return t === "" || t === "0" || t.toLowerCase() === "null";
}

export function starterSlotLabels(
  rosterPositions: string[] | null | undefined
): string[] {
  const positions = rosterPositions?.length
    ? rosterPositions
    : ["QB", "RB", "RB", "WR", "WR", "TE", "FLEX", "K", "DEF"];
  return positions.filter((p) => !NON_STARTER_SLOTS.has(String(p).toUpperCase()));
}

function pointsForPlayer(
  m: SleeperMatchup,
  playerId: string,
  starterIndex: number | null
): number {
  if (
    starterIndex != null &&
    Array.isArray(m.starters_points) &&
    starterIndex < m.starters_points.length
  ) {
    const sp = Number(m.starters_points[starterIndex]);
    if (Number.isFinite(sp)) return sp;
  }
  if (m.players_points && playerId in m.players_points) {
    const pp = Number(m.players_points[playerId]);
    if (Number.isFinite(pp)) return pp;
  }
  return 0;
}

function resolveMeta(
  playerId: string,
  playersById: Map<string, SleeperNflPlayer>
): { name: string; pos: string; nfl_team: string } {
  const player = playersById.get(playerId);
  const name = formatSleeperPlayerShortName(player, playerId);
  let pos = (player?.position || "").toUpperCase();
  let nfl_team = (player?.team || "").toUpperCase();

  // Team defenses keyed by abbr
  if ((!pos || pos === "DEF" || pos === "DST") && /^[A-Z]{2,3}$/.test(playerId)) {
    pos = pos || "DEF";
    nfl_team = nfl_team || playerId;
  }

  return { name, pos, nfl_team };
}

/**
 * Starters in league slot order + bench (roster players not starting).
 * Does not invent players — unknown ids keep empty name if cache misses.
 */
export function buildLineupFromSleeperMatchup(
  m: SleeperMatchup,
  rosterPositions: string[] | null | undefined,
  playersById: Map<string, SleeperNflPlayer>
): { starters: LineupPlayer[]; bench: LineupPlayer[] } {
  const slots = starterSlotLabels(rosterPositions);
  const starterIds = m.starters ?? [];
  const starters: LineupPlayer[] = [];

  const len = Math.max(slots.length, starterIds.length);
  for (let i = 0; i < len; i++) {
    const slot = slots[i] ?? `SLOT${i + 1}`;
    const rawId = starterIds[i];
    if (isEmptyPlayerId(rawId)) {
      starters.push({
        player_id: "",
        name: "",
        pos: "",
        nfl_team: "",
        slot,
        points: 0,
      });
      continue;
    }
    const player_id = String(rawId);
    const meta = resolveMeta(player_id, playersById);
    starters.push({
      player_id,
      name: meta.name,
      pos: meta.pos,
      nfl_team: meta.nfl_team,
      slot,
      points: pointsForPlayer(m, player_id, i),
    });
  }

  const starterSet = new Set(
    starterIds.filter((id) => !isEmptyPlayerId(id)).map(String)
  );
  const rosterPlayers = m.players ?? [];
  const bench: LineupPlayer[] = [];

  for (const rawId of rosterPlayers) {
    if (isEmptyPlayerId(rawId)) continue;
    const player_id = String(rawId);
    if (starterSet.has(player_id)) continue;
    const meta = resolveMeta(player_id, playersById);
    bench.push({
      player_id,
      name: meta.name,
      pos: meta.pos,
      nfl_team: meta.nfl_team,
      slot: "BN",
      points: pointsForPlayer(m, player_id, null),
    });
  }

  return { starters, bench };
}

/** True when Sleeper has posted at least one real starter id. */
export function hasPostedStarters(starters: LineupPlayer[] | null | undefined): boolean {
  if (!starters?.length) return false;
  return starters.some((s) => Boolean(s.player_id && s.player_id !== "0"));
}
