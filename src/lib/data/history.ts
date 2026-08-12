/**
 * League history content — placeholder legacy until seasons are recorded.
 * Edit here or later move to Supabase.
 */

export interface ChampionEntry {
  season: number;
  champion: string;
  runnerUp?: string;
  note?: string;
}

export interface HistoryMilestone {
  year: string;
  title: string;
  body: string;
}

/** Past champions — empty / TBA for inaugural Upper Deckcers season. */
export const CHAMPIONS: ChampionEntry[] = [
  {
    season: 2026,
    champion: "TBD",
    runnerUp: "TBD",
    note: "Inaugural Upper Deckcers season — hardware still on the shelf.",
  },
];

export const MILESTONES: HistoryMilestone[] = [
  {
    year: "2026",
    title: "League reborn",
    body: "Upper Deckcers takes the field. Ten teams. One draft. No excuses.",
  },
  {
    year: "Aug 30",
    title: "Draft night",
    body: "Sunday, 3:45 PM EDT. Keepers locked. Names called. Legacies start.",
  },
];

export const ALL_TIME_BLURB =
  "All-time records, trophy walls, and hall-of-shame entries will fill in as seasons complete. Until then, everyone starts at 0-0.";
