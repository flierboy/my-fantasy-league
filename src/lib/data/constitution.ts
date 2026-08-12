/**
 * League constitution / rules — solid placeholders for Upper Deckcers.
 * Commissioners can refine wording later.
 */

export interface ConstitutionSection {
  id: string;
  title: string;
  body: string[];
}

export const CONSTITUTION_INTRO =
  "This is the Upper Deckcers constitution. It is binding unless the commissioner and a majority of owners agree to change it. Ignorance is not a defense. Read it. Live it.";

export const CONSTITUTION_SECTIONS: ConstitutionSection[] = [
  {
    id: "format",
    title: "League format",
    body: [
      "10-team Yahoo Fantasy Football league.",
      "Head-to-head matchups each week during the regular season.",
      "Playoffs determine the champion and the hardware.",
    ],
  },
  {
    id: "roster",
    title: "Roster",
    body: [
      "Standard Yahoo roster slots unless the league votes otherwise before the draft.",
      "Owners are responsible for setting a valid lineup before the first game of the week kicks off.",
      "Empty or illegal lineups forfeit all points from empty slots.",
    ],
  },
  {
    id: "scoring",
    title: "Scoring",
    body: [
      "Scoring follows the league's Yahoo settings (PPR / half-PPR / standard as configured).",
      "Yahoo's official scoring and stats are final unless a clear platform error is proven.",
      "Ties in weekly matchups count as ties in the standings.",
    ],
  },
  {
    id: "keepers",
    title: "Keepers",
    body: [
      "Keeper rules are announced before the draft and must be declared by the published deadline.",
      "Default framework: limited keepers with a maximum number of seasons retained (see league settings).",
      "Failed or late keeper declarations default to no keepers for that franchise.",
    ],
  },
  {
    id: "draft",
    title: "Draft rules",
    body: [
      "Draft: Sunday, August 30, 2026 at 3:45 PM EDT.",
      "Snake draft order is published on the league site and may be adjusted only by commissioner agreement before the draft starts.",
      "No-shows may be autodrafted. Clock is law.",
      "Trades of draft picks, if allowed, must be completed before the draft begins unless otherwise stated.",
    ],
  },
  {
    id: "trades",
    title: "Trades & waivers",
    body: [
      "Trades are allowed until the league trade deadline set in Yahoo.",
      "The commissioner may veto only for clear collusion or catastrophic imbalance — not for “I don’t like it.”",
      "Waiver priority follows Yahoo league settings.",
    ],
  },
  {
    id: "dues",
    title: "Dues & prize money",
    body: [
      "Season dues are set in league settings and tracked on the Dues page.",
      "Unpaid dues may restrict playoff eligibility or prize payout at the commissioner’s discretion.",
      "Prize pool distribution (champion, runner-up, etc.) is announced before week 1.",
    ],
  },
  {
    id: "fines",
    title: "Fines",
    body: [
      "Missed lineup with multiple empty starters: fine at commissioner discretion.",
      "Chronic inactivity or tanking may result in fines, loss of draft capital, or removal.",
      "Fines, if assessed, are added to the prize pool unless otherwise agreed.",
    ],
  },
  {
    id: "punishments",
    title: "Punishments",
    body: [
      "Last place may face a league punishment (content, attire, or task) voted or set preseason.",
      "Punishment must be completed before the next draft or as otherwise scheduled.",
      "Failure to complete a punishment may carry over penalties into the following season.",
    ],
  },
  {
    id: "conduct",
    title: "Conduct",
    body: [
      "Trash talk is encouraged. Harassment, threats, or bigotry are not.",
      "The commissioner may remove posts or owners who cross the line.",
      "All owners agree to keep the league fun, competitive, and solvent.",
    ],
  },
  {
    id: "amendments",
    title: "Amendments",
    body: [
      "Rule changes require commissioner proposal and majority owner approval, unless emergency platform fixes are required.",
      "This document may be updated on the site; material changes should be announced in trash talk or a poll.",
    ],
  },
];
