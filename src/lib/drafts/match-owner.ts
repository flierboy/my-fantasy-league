/**
 * Fuzzy match fantasy team / manager names to site owners.
 */

import { normalizeName } from "@/lib/espn/client";

export type OwnerMatchTarget = {
  id: string;
  display_name: string;
  team_name: string | null;
  sleeper_username?: string | null;
};

/** Known aliases from Yahoo/ESPN team names → site display_name fragments */
const ALIASES: Record<string, string[]> = {
  len: [
    "len",
    "thicky len",
    "leonidas len",
    "leonidas",
    "lens daddy",
    "lens",
    "thickylen",
  ],
  "yo mama": ["yo mama", "yomama", "yo momma", "your mama"],
  "ham bone": [
    "ham bone",
    "hamie",
    "team hamie",
    "hambone",
    "ham",
    "hammy",
  ],
  bigbrownstain: ["bigbrownstain", "big brown stain", "bbs", "brown stain"],
  "big lloyd": [
    "big lloyd",
    "lloyd",
    "biglloyd",
    "davids dangerous team",
    "lloyd assaults women",
  ],
  whitstits: [
    "whitstits",
    "whits tits",
    "whit",
    "whits",
    "olewhit",
    "ole whit",
  ],
  "playoff lock mase": [
    "playoff lock mase",
    "mase",
    "playoff lock",
    "playofflock",
    "maisons magnificent team",
    "greenhorn mase",
  ],
  "starvin marvin": ["starvin marvin", "marvin", "starvin", "starving marvin"],
  "benny backshots": ["benny backshots", "benny", "backshots"],
  // Extra fantasy names that may map if display_name contains token
  reesee: ["reesee", "reese"],
  zack: ["zack", "zacks honorable team"],
};

function aliasKeyForOwner(owner: OwnerMatchTarget): string | null {
  const n = normalizeName(owner.display_name);
  for (const key of Object.keys(ALIASES)) {
    if (n === key || n.includes(key) || key.includes(n)) return key;
  }
  return null;
}

export function matchOwnerId(
  fantasyName: string,
  owners: OwnerMatchTarget[]
): string | null {
  const n = normalizeName(fantasyName);
  if (!n) return null;

  // Exact display / team / sleeper
  for (const o of owners) {
    if (normalizeName(o.display_name) === n) return o.id;
    if (o.team_name && normalizeName(o.team_name) === n) return o.id;
    if (o.sleeper_username && normalizeName(o.sleeper_username) === n) {
      return o.id;
    }
  }

  // Alias table
  for (const o of owners) {
    const key = aliasKeyForOwner(o);
    if (!key) continue;
    const aliases = ALIASES[key] ?? [];
    for (const a of aliases) {
      if (n === a || n.includes(a) || a.includes(n)) return o.id;
    }
  }

  // Partial containment
  for (const o of owners) {
    const od = normalizeName(o.display_name);
    const ot = o.team_name ? normalizeName(o.team_name) : "";
    if (od.length >= 3 && (n.includes(od) || od.includes(n))) return o.id;
    if (ot.length >= 3 && (n.includes(ot) || ot.includes(n))) return o.id;
  }

  return null;
}
