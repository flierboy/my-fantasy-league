import type { EspnLeaguePayload, EspnTeam } from "./client";
import {
  espnTeamDisplayName,
  normalizeName,
} from "./client";

export type MappedEspnTeam = {
  espnTeamId: number;
  teamName: string;
  ownerDisplayNames: string[];
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  playoffSeed: number | null;
  rankFinal: number | null;
};

export type MappedEspnMatchup = {
  week: number;
  homeEspnId: number;
  awayEspnId: number;
  homeScore: number | null;
  awayScore: number | null;
  isPlayoff: boolean;
  isComplete: boolean;
};

export type EspnImportPlan = {
  season: number;
  leagueName: string | null;
  teams: MappedEspnTeam[];
  matchups: MappedEspnMatchup[];
  championTeamName: string | null;
  runnerUpTeamName: string | null;
};

function memberMap(payload: EspnLeaguePayload) {
  const map = new Map<string, string>();
  for (const m of payload.members ?? []) {
    const name =
      m.displayName ||
      [m.firstName, m.lastName].filter(Boolean).join(" ") ||
      m.id;
    map.set(m.id, name);
    map.set(m.id.replace(/[{}]/g, ""), name);
  }
  return map;
}

function ownerNames(team: EspnTeam, members: Map<string, string>): string[] {
  const ids = team.owners?.length
    ? team.owners
    : team.primaryOwner
      ? [team.primaryOwner]
      : [];
  return ids
    .map((id) => members.get(id) || members.get(id.replace(/[{}]/g, "")) || id)
    .filter(Boolean);
}

export function buildImportPlan(
  payload: EspnLeaguePayload,
  season: number
): EspnImportPlan {
  const members = memberMap(payload);
  const teams: MappedEspnTeam[] = (payload.teams ?? []).map((t) => {
    const overall = t.record?.overall ?? {};
    const rank =
      t.rankCalculatedFinal && t.rankCalculatedFinal > 0
        ? t.rankCalculatedFinal
        : t.rankFinal && t.rankFinal > 0
          ? t.rankFinal
          : null;
    return {
      espnTeamId: t.id,
      teamName: espnTeamDisplayName(t),
      ownerDisplayNames: ownerNames(t, members),
      wins: Number(overall.wins ?? 0),
      losses: Number(overall.losses ?? 0),
      ties: Number(overall.ties ?? 0),
      pointsFor: Number(overall.pointsFor ?? t.points ?? 0),
      pointsAgainst: Number(overall.pointsAgainst ?? t.pointsAgainst ?? 0),
      playoffSeed:
        t.playoffSeed && t.playoffSeed > 0 ? t.playoffSeed : null,
      rankFinal: rank,
    };
  });

  // Champion = final rank 1, else best record among teams with rank
  let champion: MappedEspnTeam | null =
    teams.find((t) => t.rankFinal === 1) ?? null;
  let runnerUp: MappedEspnTeam | null =
    teams.find((t) => t.rankFinal === 2) ?? null;

  if (!champion) {
    // Infer from playoff matchups if scores exist
    const playoff = (payload.schedule ?? []).filter(
      (g) =>
        g.playoffTierType &&
        g.playoffTierType !== "NONE" &&
        g.winner &&
        g.winner !== "UNDECIDED"
    );
    if (playoff.length) {
      const last = playoff.sort(
        (a, b) => b.matchupPeriodId - a.matchupPeriodId
      )[0];
      const winId =
        last.winner === "HOME"
          ? last.home?.teamId
          : last.winner === "AWAY"
            ? last.away?.teamId
            : null;
      const loseId =
        last.winner === "HOME"
          ? last.away?.teamId
          : last.winner === "AWAY"
            ? last.home?.teamId
            : null;
      if (winId != null) {
        champion = teams.find((t) => t.espnTeamId === winId) ?? null;
      }
      if (loseId != null) {
        runnerUp = teams.find((t) => t.espnTeamId === loseId) ?? null;
      }
    }
  }

  const matchups: MappedEspnMatchup[] = [];
  for (const g of payload.schedule ?? []) {
    const homeId = g.home?.teamId;
    const awayId = g.away?.teamId;
    if (homeId == null || awayId == null) continue;
    const homeScore =
      g.home?.totalPoints != null ? Number(g.home.totalPoints) : null;
    const awayScore =
      g.away?.totalPoints != null ? Number(g.away.totalPoints) : null;
    const isComplete =
      g.winner != null &&
      g.winner !== "UNDECIDED" &&
      homeScore != null &&
      awayScore != null &&
      (homeScore > 0 || awayScore > 0);
    matchups.push({
      week: g.matchupPeriodId,
      homeEspnId: homeId,
      awayEspnId: awayId,
      homeScore: isComplete ? homeScore : homeScore,
      awayScore: isComplete ? awayScore : awayScore,
      isPlayoff: Boolean(
        g.playoffTierType && g.playoffTierType !== "NONE"
      ),
      isComplete,
    });
  }

  return {
    season,
    leagueName: payload.settings?.name ?? null,
    teams: teams.sort(
      (a, b) => (a.rankFinal ?? 99) - (b.rankFinal ?? 99)
    ),
    matchups,
    championTeamName: champion?.teamName ?? null,
    runnerUpTeamName: runnerUp?.teamName ?? null,
  };
}

/** Find best matching site owner for an ESPN team name. */
export function matchOwnerId(
  teamName: string,
  owners: { id: string; display_name: string; team_name: string | null }[]
): string | null {
  const n = normalizeName(teamName);
  if (!n) return null;

  // Exact display / team
  for (const o of owners) {
    if (normalizeName(o.display_name) === n) return o.id;
    if (o.team_name && normalizeName(o.team_name) === n) return o.id;
  }

  // Containment (e.g. "HAMIE" vs "HAM BONE", "Yo mama" vs "yo mama")
  for (const o of owners) {
    const od = normalizeName(o.display_name);
    const ot = o.team_name ? normalizeName(o.team_name) : "";
    if (od && (n.includes(od) || od.includes(n))) return o.id;
    if (ot && (n.includes(ot) || ot.includes(n))) return o.id;
  }

  return null;
}
