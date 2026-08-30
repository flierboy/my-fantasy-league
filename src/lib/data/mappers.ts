import type {
  BadgeKey,
  DuePayment,
  LeagueSettings,
  LineupPlayer,
  Matchup,
  Owner,
  Poll,
  PollVote,
  Standing,
  TrashTalkPost,
} from "@/lib/types";
import { BADGE_KEYS as CANONICAL_BADGE_KEYS } from "@/lib/data/badges";

/** Valid badge keys — filter unknown values from the DB. */
export const BADGE_KEYS = CANONICAL_BADGE_KEYS;

export function mapOwner(row: Record<string, unknown>): Owner {
  const rawBadges = Array.isArray(row.badges) ? (row.badges as string[]) : [];
  const badges = rawBadges.filter((b): b is BadgeKey =>
    BADGE_KEYS.has(b as BadgeKey)
  );
  const is_admin = Boolean(row.is_admin);
  const rawRole =
    row.role == null || String(row.role).trim() === ""
      ? null
      : String(row.role).trim();

  // Fall back so cards aren't empty before migrate-owner-role.sql is run
  let role = rawRole;
  if (!role) {
    if (is_admin) role = "Commissioner";
    else if (badges.includes("commissioner")) role = "Commissioner";
  }

  return {
    id: String(row.id),
    user_id: row.user_id == null ? null : String(row.user_id),
    display_name: String(row.display_name),
    team_name: (row.team_name as string | null) ?? null,
    avatar_url: (row.avatar_url as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    email_opt_out: Boolean(row.email_opt_out ?? false),
    wins: Number(row.wins ?? 0),
    losses: Number(row.losses ?? 0),
    ties: Number(row.ties ?? 0),
    prize_money: Number(row.prize_money ?? 0),
    badges,
    is_admin,
    role,
    favorite_nfl_team:
      row.favorite_nfl_team == null || String(row.favorite_nfl_team).trim() === ""
        ? null
        : String(row.favorite_nfl_team).trim(),
    sleeper_username:
      row.sleeper_username == null || String(row.sleeper_username).trim() === ""
        ? null
        : String(row.sleeper_username).trim(),
    draft_slot: row.draft_slot == null ? null : Number(row.draft_slot),
    sort_order: Number(row.sort_order ?? 0),
  };
}

export function mapLeague(row: Record<string, unknown>): LeagueSettings {
  return {
    name: String(row.name),
    tagline: String(row.tagline),
    rules_summary: String(row.rules_summary),
    dues_amount: Number(row.dues_amount ?? 250),
    keeper_count: Number(row.keeper_count ?? 1),
    keeper_max_seasons: Number(row.keeper_max_seasons ?? 2),
    season_year: Number(row.season_year ?? 2026),
    trophy_blurb: String(row.trophy_blurb),
    draft_at: row.draft_at == null ? null : String(row.draft_at),
    auto_award_weekly_badges:
      row.auto_award_weekly_badges === undefined ||
      row.auto_award_weekly_badges === null
        ? true
        : Boolean(row.auto_award_weekly_badges),
    last_sleeper_sync_at:
      row.last_sleeper_sync_at == null
        ? null
        : String(row.last_sleeper_sync_at),
  };
}

function mapLineupPlayers(raw: unknown): LineupPlayer[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const r = (item ?? {}) as Record<string, unknown>;
    return {
      player_id: String(r.player_id ?? ""),
      name: String(r.name ?? ""),
      pos: String(r.pos ?? ""),
      nfl_team: String(r.nfl_team ?? ""),
      slot: String(r.slot ?? ""),
      points: Number(r.points ?? 0) || 0,
    };
  });
}

export function mapMatchup(
  row: Record<string, unknown>,
  ownersById: Map<string, Owner>
): Matchup {
  const homeId = String(row.home_owner_id);
  const awayId = String(row.away_owner_id);
  return {
    id: String(row.id),
    season: Number(row.season),
    week: Number(row.week),
    home_owner_id: homeId,
    away_owner_id: awayId,
    home_score: row.home_score == null ? null : Number(row.home_score),
    away_score: row.away_score == null ? null : Number(row.away_score),
    is_playoff: Boolean(row.is_playoff),
    is_complete: Boolean(row.is_complete),
    home_starters: mapLineupPlayers(row.home_starters),
    away_starters: mapLineupPlayers(row.away_starters),
    home_bench: mapLineupPlayers(row.home_bench),
    away_bench: mapLineupPlayers(row.away_bench),
    home_owner: ownersById.get(homeId),
    away_owner: ownersById.get(awayId),
  };
}

export function mapStanding(
  row: Record<string, unknown>,
  ownersById: Map<string, Owner>
): Standing {
  const ownerId = String(row.owner_id);
  return {
    id: String(row.id),
    season: Number(row.season),
    week: row.week == null ? null : Number(row.week),
    owner_id: ownerId,
    wins: Number(row.wins ?? 0),
    losses: Number(row.losses ?? 0),
    ties: Number(row.ties ?? 0),
    points_for: Number(row.points_for ?? 0),
    points_against: Number(row.points_against ?? 0),
    rank: Number(row.rank ?? 0),
    owner: ownersById.get(ownerId),
  };
}

export function mapDue(
  row: Record<string, unknown>,
  ownersById: Map<string, Owner>
): DuePayment {
  const ownerId = String(row.owner_id);
  return {
    id: String(row.id),
    owner_id: ownerId,
    season: Number(row.season),
    amount_due: Number(row.amount_due ?? 0),
    amount_paid: Number(row.amount_paid ?? 0),
    paid_at: (row.paid_at as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    owner: ownersById.get(ownerId),
  };
}

export function mapPoll(row: Record<string, unknown>): Poll {
  return {
    id: String(row.id),
    title: String(row.title),
    description: (row.description as string | null) ?? null,
    options: Array.isArray(row.options) ? (row.options as string[]) : [],
    created_by: row.created_by == null ? "" : String(row.created_by),
    is_active: Boolean(row.is_active),
    closes_at: (row.closes_at as string | null) ?? null,
    created_at: String(row.created_at),
  };
}

export function mapPollVote(row: Record<string, unknown>): PollVote {
  return {
    id: String(row.id),
    poll_id: String(row.poll_id),
    owner_id: String(row.owner_id),
    option_index: Number(row.option_index),
    created_at: String(row.created_at),
  };
}

export function mapTrashPost(
  row: Record<string, unknown>,
  ownersById: Map<string, Owner>
): TrashTalkPost {
  const ownerId = String(row.owner_id);
  return {
    id: String(row.id),
    owner_id: ownerId,
    body: String(row.body),
    created_at: String(row.created_at),
    owner: ownersById.get(ownerId),
  };
}

export function ownersByIdMap(owners: Owner[]): Map<string, Owner> {
  return new Map(owners.map((o) => [o.id, o]));
}
