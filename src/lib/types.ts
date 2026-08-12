/**
 * Shared domain types for the fantasy football league.
 * These mirror the Supabase schema in /supabase/schema.sql.
 */

export type BadgeKey =
  | "champion"
  | "commissioner"
  | "rookie"
  | "punished"
  | "it"
  | "runner_up"
  | "toilet";

export interface Badge {
  key: BadgeKey;
  label: string;
  emoji: string;
  description: string;
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
  prize_money: number;
  badges: BadgeKey[];
  is_admin: boolean;
  draft_slot: number | null;
  sort_order: number;
}

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
