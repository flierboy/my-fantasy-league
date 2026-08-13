import type { SleeperLeague, SleeperRoster, SleeperUser } from "./client";
import {
  normalizeName,
  sleeperPoints,
  sleeperPointsAgainst,
} from "./client";

export type MappedSleeperTeam = {
  rosterId: number;
  sleeperUserId: string | null;
  userDisplayName: string | null;
  teamName: string;
  isCommissioner: boolean;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  waiverPosition: number | null;
  openSlot: boolean;
};

export type SleeperSyncPreview = {
  leagueId: string;
  leagueName: string;
  season: string;
  status: string;
  totalRosters: number;
  numTeams: number;
  playoffTeams: number | null;
  teams: MappedSleeperTeam[];
  openRosterSlots: number;
  joinedUsers: number;
};

export function buildSleeperPreview(
  league: SleeperLeague,
  users: SleeperUser[],
  rosters: SleeperRoster[]
): SleeperSyncPreview {
  const byUser = new Map(users.map((u) => [u.user_id, u]));

  const teams: MappedSleeperTeam[] = rosters.map((r) => {
    const user = r.owner_id ? byUser.get(r.owner_id) : undefined;
    const metaName = user?.metadata?.team_name?.trim();
    const teamName =
      metaName ||
      user?.display_name ||
      (r.owner_id ? `Roster ${r.roster_id}` : `Open slot ${r.roster_id}`);

    return {
      rosterId: r.roster_id,
      sleeperUserId: r.owner_id,
      userDisplayName: user?.display_name ?? null,
      teamName,
      isCommissioner: Boolean(user?.is_owner),
      wins: Number(r.settings?.wins ?? 0),
      losses: Number(r.settings?.losses ?? 0),
      ties: Number(r.settings?.ties ?? 0),
      pointsFor: sleeperPoints(r.settings),
      pointsAgainst: sleeperPointsAgainst(r.settings),
      waiverPosition:
        r.settings?.waiver_position != null
          ? Number(r.settings.waiver_position)
          : null,
      openSlot: !r.owner_id,
    };
  });

  // Sort: filled teams first by wins, then roster id
  teams.sort((a, b) => {
    if (a.openSlot !== b.openSlot) return a.openSlot ? 1 : -1;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.rosterId - b.rosterId;
  });

  return {
    leagueId: league.league_id,
    leagueName: league.name,
    season: league.season,
    status: league.status,
    totalRosters: league.total_rosters,
    numTeams: Number(league.settings?.num_teams ?? league.total_rosters),
    playoffTeams:
      league.settings?.playoff_teams != null
        ? Number(league.settings.playoff_teams)
        : null,
    teams,
    openRosterSlots: teams.filter((t) => t.openSlot).length,
    joinedUsers: users.length,
  };
}

export function matchOwnerId(
  names: string[],
  owners: {
    id: string;
    display_name: string;
    team_name: string | null;
    sleeper_username?: string | null;
  }[]
): string | null {
  const candidates = names
    .map((n) => normalizeName(n))
    .filter(Boolean);

  for (const n of candidates) {
    for (const o of owners) {
      if (normalizeName(o.display_name) === n) return o.id;
      if (o.team_name && normalizeName(o.team_name) === n) return o.id;
      if (o.sleeper_username && normalizeName(o.sleeper_username) === n) {
        return o.id;
      }
    }
  }

  for (const n of candidates) {
    for (const o of owners) {
      const od = normalizeName(o.display_name);
      const ot = o.team_name ? normalizeName(o.team_name) : "";
      const os = o.sleeper_username
        ? normalizeName(o.sleeper_username)
        : "";
      if (od && (n.includes(od) || od.includes(n))) return o.id;
      if (ot && (n.includes(ot) || ot.includes(n))) return o.id;
      if (os && (n.includes(os) || os.includes(n))) return o.id;
    }
  }

  return null;
}
