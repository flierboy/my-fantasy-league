/**
 * Pure constitution types, keys, static fallback, and mappers.
 * Safe for Client Components — no next/headers or Supabase server client.
 */

export interface ConstitutionSection {
  id: string;
  section_key: string;
  title: string;
  /** Bullet lines for display */
  body: string[];
  /** Raw body text (newlines = bullets) for admin edit */
  body_raw: string;
  sort_order: number;
}

export const CONSTITUTION_INTRO =
  "This is the Upper Deckcers constitution. It is binding unless the commissioner and a majority of owners agree to change it. Ignorance is not a defense. Read it. Live it.";

/** Suggested keys for admin dropdown */
export const CONSTITUTION_SECTION_KEYS = [
  "format",
  "roster",
  "scoring",
  "keepers",
  "draft",
  "trades",
  "dues",
  "fines",
  "punishments",
  "conduct",
  "amendments",
  "other",
] as const;

export type ConstitutionSectionKey =
  (typeof CONSTITUTION_SECTION_KEYS)[number];

/** Static fallback — used when DB has no rows or is unavailable. */
export const CONSTITUTION_SECTIONS: ConstitutionSection[] = [
  {
    id: "format",
    section_key: "format",
    title: "League format",
    body: [
      "10-team Yahoo Fantasy Football league.",
      "Head-to-head matchups each week during the regular season.",
      "Playoffs determine the champion and the hardware.",
    ],
    body_raw:
      "10-team Yahoo Fantasy Football league.\nHead-to-head matchups each week during the regular season.\nPlayoffs determine the champion and the hardware.",
    sort_order: 10,
  },
  {
    id: "roster",
    section_key: "roster",
    title: "Roster",
    body: [
      "Standard Yahoo roster slots unless the league votes otherwise before the draft.",
      "Owners are responsible for setting a valid lineup before the first game of the week kicks off.",
      "Empty or illegal lineups forfeit all points from empty slots.",
    ],
    body_raw:
      "Standard Yahoo roster slots unless the league votes otherwise before the draft.\nOwners are responsible for setting a valid lineup before the first game of the week kicks off.\nEmpty or illegal lineups forfeit all points from empty slots.",
    sort_order: 20,
  },
  {
    id: "scoring",
    section_key: "scoring",
    title: "Scoring",
    body: [
      "Scoring follows the league's Yahoo settings (PPR / half-PPR / standard as configured).",
      "Yahoo's official scoring and stats are final unless a clear platform error is proven.",
      "Ties in weekly matchups count as ties in the standings.",
    ],
    body_raw:
      "Scoring follows the league's Yahoo settings (PPR / half-PPR / standard as configured).\nYahoo's official scoring and stats are final unless a clear platform error is proven.\nTies in weekly matchups count as ties in the standings.",
    sort_order: 30,
  },
  {
    id: "keepers",
    section_key: "keepers",
    title: "Keepers",
    body: [
      "Keeper rules are announced before the draft and must be declared by the published deadline.",
      "Default framework: limited keepers with a maximum number of seasons retained (see league settings).",
      "Failed or late keeper declarations default to no keepers for that franchise.",
    ],
    body_raw:
      "Keeper rules are announced before the draft and must be declared by the published deadline.\nDefault framework: limited keepers with a maximum number of seasons retained (see league settings).\nFailed or late keeper declarations default to no keepers for that franchise.",
    sort_order: 40,
  },
  {
    id: "draft",
    section_key: "draft",
    title: "Draft rules",
    body: [
      "Draft: Sunday, August 30, 2026 at 3:45 PM EDT.",
      "Snake draft order is published on the league site and may be adjusted only by commissioner agreement before the draft starts.",
      "No-shows may be autodrafted. Clock is law.",
      "Trades of draft picks, if allowed, must be completed before the draft begins unless otherwise stated.",
    ],
    body_raw:
      "Draft: Sunday, August 30, 2026 at 3:45 PM EDT.\nSnake draft order is published on the league site and may be adjusted only by commissioner agreement before the draft starts.\nNo-shows may be autodrafted. Clock is law.\nTrades of draft picks, if allowed, must be completed before the draft begins unless otherwise stated.",
    sort_order: 50,
  },
  {
    id: "trades",
    section_key: "trades",
    title: "Trades & waivers",
    body: [
      "Trades are allowed until the league trade deadline set in Yahoo.",
      "The commissioner may veto only for clear collusion or catastrophic imbalance — not for “I don’t like it.”",
      "Waiver priority follows Yahoo league settings.",
    ],
    body_raw:
      "Trades are allowed until the league trade deadline set in Yahoo.\nThe commissioner may veto only for clear collusion or catastrophic imbalance — not for “I don’t like it.”\nWaiver priority follows Yahoo league settings.",
    sort_order: 60,
  },
  {
    id: "dues",
    section_key: "dues",
    title: "Dues & prize money",
    body: [
      "Season dues are set in league settings and tracked on the Dues page.",
      "Unpaid dues may restrict playoff eligibility or prize payout at the commissioner’s discretion.",
      "Prize pool distribution (champion, runner-up, etc.) is announced before week 1.",
    ],
    body_raw:
      "Season dues are set in league settings and tracked on the Dues page.\nUnpaid dues may restrict playoff eligibility or prize payout at the commissioner’s discretion.\nPrize pool distribution (champion, runner-up, etc.) is announced before week 1.",
    sort_order: 70,
  },
  {
    id: "fines",
    section_key: "fines",
    title: "Fines",
    body: [
      "Missed lineup with multiple empty starters: fine at commissioner discretion.",
      "Chronic inactivity or tanking may result in fines, loss of draft capital, or removal.",
      "Fines, if assessed, are added to the prize pool unless otherwise agreed.",
    ],
    body_raw:
      "Missed lineup with multiple empty starters: fine at commissioner discretion.\nChronic inactivity or tanking may result in fines, loss of draft capital, or removal.\nFines, if assessed, are added to the prize pool unless otherwise agreed.",
    sort_order: 80,
  },
  {
    id: "punishments",
    section_key: "punishments",
    title: "Punishments",
    body: [
      "Last place may face a league punishment (content, attire, or task) voted or set preseason.",
      "Punishment must be completed before the next draft or as otherwise scheduled.",
      "Failure to complete a punishment may carry over penalties into the following season.",
    ],
    body_raw:
      "Last place may face a league punishment (content, attire, or task) voted or set preseason.\nPunishment must be completed before the next draft or as otherwise scheduled.\nFailure to complete a punishment may carry over penalties into the following season.",
    sort_order: 90,
  },
  {
    id: "conduct",
    section_key: "conduct",
    title: "Conduct",
    body: [
      "Trash talk is encouraged. Harassment, threats, or bigotry are not.",
      "The commissioner may remove posts or owners who cross the line.",
      "All owners agree to keep the league fun, competitive, and solvent.",
    ],
    body_raw:
      "Trash talk is encouraged. Harassment, threats, or bigotry are not.\nThe commissioner may remove posts or owners who cross the line.\nAll owners agree to keep the league fun, competitive, and solvent.",
    sort_order: 100,
  },
  {
    id: "amendments",
    section_key: "amendments",
    title: "Amendments",
    body: [
      "Rule changes require commissioner proposal and majority owner approval, unless emergency platform fixes are required.",
      "This document may be updated on the site; material changes should be announced in trash talk or a poll.",
    ],
    body_raw:
      "Rule changes require commissioner proposal and majority owner approval, unless emergency platform fixes are required.\nThis document may be updated on the site; material changes should be announced in trash talk or a poll.",
    sort_order: 110,
  },
  {
    id: "other",
    section_key: "other",
    title: "Other",
    body: [
      "Anything not covered above falls under commissioner discretion and common sense.",
    ],
    body_raw:
      "Anything not covered above falls under commissioner discretion and common sense.",
    sort_order: 120,
  },
];

export function bodyToLines(raw: string): string[] {
  return raw
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function mapConstitutionSection(
  row: Record<string, unknown>
): ConstitutionSection {
  const body_raw = String(row.body ?? "");
  return {
    id: String(row.id),
    section_key: String(row.section_key ?? "other"),
    title: String(row.title ?? ""),
    body: bodyToLines(body_raw),
    body_raw,
    sort_order: Number(row.sort_order ?? 0),
  };
}
