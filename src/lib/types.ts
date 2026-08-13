/**
 * Shared domain types for the fantasy football league.
 * These mirror the Supabase schema in /supabase/schema.sql.
 */

/** Badge categories for hall + admin grouping */
export type BadgeCategory =
  | "season"
  | "draft_strategic"
  | "draft_cautionary"
  | "weekly_top"
  | "weekly_heartbreak"
  | "weekly_specialty"
  | "legacy";

export type BadgeKey =
  // Season awards
  | "champion"
  | "punished"
  | "commissioner"
  | "it"
  | "rookie"
  | "runner_up"
  | "regular_season_champ"
  | "high_scorer"
  | "founding_member"
  // Draft · Strategic
  | "draft_guru"
  | "sleeper_sniper"
  | "value_hunter"
  | "position_stack_king"
  | "rookie_whisperer"
  | "gridiron_nostradamus"
  // Draft · Cautionary
  | "reach_of_the_year"
  | "auto_draft_hero"
  | "injury_magnet"
  | "homer_award"
  | "kicker_in_the_9th"
  // Weekly · Top performers
  | "apex_predator"
  | "blowout_machine"
  | "heavy_hitter"
  | "bench_depth_flex"
  | "upset_artist"
  // Weekly · Heartbreak
  | "bench_blunder"
  | "heartbreak_kid"
  | "squeaked_by"
  | "punching_bag"
  | "bye_week_blunder"
  // Weekly · Specialty
  | "monday_night_miracle"
  | "waiver_wire_wizard"
  | "defense_wins"
  | "clutch_kicker"
  // Legacy (kept from earlier system)
  | "toilet"
  | "iron_man";

export interface Badge {
  key: BadgeKey;
  label: string;
  emoji: string;
  description: string;
  category: BadgeCategory;
  /** Tailwind-friendly gradient classes for the badge chip */
  className: string;
}

export interface Owner {
  id: string;
  /** Linked Supabase auth.users id (null until account is connected). */
  user_id: string | null;
  display_name: string;
  team_name: string | null;
  avatar_url: string | null;
  email: string | null;
  wins: number;
  losses: number;
  ties: number;
  /** Career prize money / cash total */
  prize_money: number;
  badges: BadgeKey[];
  is_admin: boolean;
  /**
   * Public role label shown on player cards
   * (Commissioner, Co-Commissioner, Owner, etc.)
   */
  role: string | null;
  /** Favorite NFL team abbr/name (e.g. KC, DAL) */
  favorite_nfl_team: string | null;
  /** Sleeper username/display for roster matching */
  sleeper_username: string | null;
  draft_slot: number | null;
  sort_order: number;
}

/** Common roles for admin dropdown */
export const OWNER_ROLE_OPTIONS = [
  "",
  "Commissioner",
  "Co-Commissioner",
  "Owner",
  "Rookie",
  "IT",
] as const;

/** NFL team abbreviations for favorite team picker */
export const NFL_TEAM_OPTIONS = [
  "",
  "ARI",
  "ATL",
  "BAL",
  "BUF",
  "CAR",
  "CHI",
  "CIN",
  "CLE",
  "DAL",
  "DEN",
  "DET",
  "GB",
  "HOU",
  "IND",
  "JAX",
  "KC",
  "LAC",
  "LAR",
  "LV",
  "MIA",
  "MIN",
  "NE",
  "NO",
  "NYG",
  "NYJ",
  "PHI",
  "PIT",
  "SEA",
  "SF",
  "TB",
  "TEN",
  "WAS",
] as const;

export interface DraftSlot {
  position: number;
  owner: Owner;
}

export interface Standing {
  id: string;
  season: number;
  week: number | null;
  owner_id: string;
  wins: number;
  losses: number;
  ties: number;
  points_for: number;
  points_against: number;
  rank: number;
  owner?: Owner;
}

export interface Matchup {
  id: string;
  season: number;
  week: number;
  home_owner_id: string;
  away_owner_id: string;
  home_score: number | null;
  away_score: number | null;
  is_playoff: boolean;
  is_complete: boolean;
  home_owner?: Owner;
  away_owner?: Owner;
}

export interface Poll {
  id: string;
  title: string;
  description: string | null;
  options: string[];
  created_by: string;
  is_active: boolean;
  closes_at: string | null;
  created_at: string;
}

export interface PollVote {
  id: string;
  poll_id: string;
  owner_id: string;
  option_index: number;
  created_at: string;
}

export interface TrashTalkPost {
  id: string;
  owner_id: string;
  body: string;
  created_at: string;
  owner?: Owner;
}

export interface LeagueSettings {
  name: string;
  tagline: string;
  rules_summary: string;
  dues_amount: number;
  keeper_count: number;
  keeper_max_seasons: number;
  season_year: number;
  trophy_blurb: string;
  /** ISO timestamptz for draft countdown (e.g. 2026-08-30T19:45:00.000Z). */
  draft_at: string | null;
}

export interface DuePayment {
  id: string;
  owner_id: string;
  season: number;
  amount_due: number;
  amount_paid: number;
  paid_at: string | null;
  notes: string | null;
  owner?: Owner;
}

/** Admin-editable history rows stored in public.history_entries */
export type HistoryEntryType = "champion" | "milestone" | "record" | "note";

export interface HistoryEntry {
  id: string;
  entry_type: HistoryEntryType;
  year_label: string;
  season_year: number | null;
  title: string;
  champion: string | null;
  runner_up: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** Manual past-season standings (not live weekly standings) */
export interface PastSeason {
  id: string;
  season_year: number;
  label: string;
  recap_notes: string | null;
  champion_owner_id: string | null;
  runner_up_owner_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  standings?: PastSeasonStanding[];
  champion?: Owner | null;
  runner_up?: Owner | null;
}

export interface PastSeasonStanding {
  id: string;
  season_id: string;
  owner_id: string | null;
  team_name: string | null;
  wins: number;
  losses: number;
  ties: number;
  points_for: number;
  points_against: number;
  rank: number;
  is_champion: boolean;
  is_runner_up: boolean;
  owner?: Owner | null;
}

/** Wall of Shame punishment entries */
export interface Punishment {
  id: string;
  season_year: number;
  owner_id: string | null;
  owner_label: string | null;
  title: string;
  description: string;
  photo_url: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  owner?: Owner | null;
}

/** Draft history */
export type DraftSource = "espn" | "yahoo" | "sleeper" | "manual";

export interface DraftYear {
  id: string;
  season_year: number;
  source: DraftSource;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  picks?: DraftPick[];
  pick_count?: number;
}

export interface DraftPick {
  id: string;
  draft_year_id: string;
  season_year: number;
  round: number;
  pick_in_round: number;
  overall_pick: number;
  player_name: string;
  position: string | null;
  nfl_team: string | null;
  fantasy_owner_name: string;
  owner_id: string | null;
  owner?: Owner | null;
}

export const DRAFT_SOURCE_OPTIONS: {
  value: DraftSource;
  label: string;
}[] = [
  { value: "espn", label: "ESPN" },
  { value: "yahoo", label: "Yahoo" },
  { value: "sleeper", label: "Sleeper" },
  { value: "manual", label: "Manual" },
];

/** Default Upper Deckcers draft: Sun Aug 30, 2026 3:45 PM EDT = 19:45 UTC */
export const DEFAULT_DRAFT_AT = "2026-08-30T19:45:00.000Z";

export const HISTORY_ENTRY_TYPES: {
  value: HistoryEntryType;
  label: string;
  hint: string;
}[] = [
  {
    value: "champion",
    label: "Champion",
    hint: "Season winner + optional runner-up",
  },
  {
    value: "milestone",
    label: "Milestone / trophy",
    hint: "Draft nights, league events, hardware moments",
  },
  {
    value: "record",
    label: "All-time record / stat",
    hint: "Notable franchise or single-season stats",
  },
  {
    value: "note",
    label: "Free-form note",
    hint: "Season summary or general history text",
  },
];
