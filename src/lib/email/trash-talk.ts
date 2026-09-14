export type MatchupForTalk = {
  homeName: string;
  awayName: string;
  homeScore: number | null;
  awayScore: number | null;
};

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function pick(seed: string, lines: string[]): string {
  return lines[hash(seed) % lines.length] ?? lines[0];
}

export function trashTalkForMatchup(m: MatchupForTalk, week: number): string {
  const a = m.awayName;
  const h = m.homeName;
  const as = m.awayScore;
  const hs = m.homeScore;
  const seed = week + "|" + a + "|" + h + "|" + as + "|" + hs;
  if (a === "BYE" || h === "BYE") {
    return pick(seed, [
      (a === "BYE" ? h : a) + " sat this one out. Even their bench looked relieved.",
      "Bye week. Still somehow underperformed expectations.",
    ]);
  }
  if (as == null || hs == null) {
    return pick(seed, [
      a + " vs " + h + " — no score yet. Both lineups already look like a cry for help.",
      "Still pending. Set your starters or just accept the Ice now.",
    ]);
  }
  const margin = Math.abs(as - hs);
  const high = Math.max(as, hs);
  const low = Math.min(as, hs);
  const winner = as > hs ? a : hs > as ? h : null;
  const loser = as > hs ? h : hs > as ? a : null;
  if (!winner || !loser) {
    return pick(seed, [
      a + " and " + h + " tied. Two stiffs, one scoreboard, zero dignity.",
      "A tie. You both lost. Check the fridge. Check the waiver wire. Check your life.",
    ]);
  }
  if (margin < 1) {
    return pick(seed, [
      winner + " stole it from " + loser + " by " + margin.toFixed(2) + ". That's a parking ticket with extra steps.",
      loser + " lost by " + margin.toFixed(2) + ". Hide this email from the group chat.",
    ]);
  }
  if (margin < 5) {
    return pick(seed, [
      winner + " escaped " + loser + ". Close game. Ugly win. Uglier loss.",
      loser + " had " + winner + " right there and still coughed it up. Classic.",
    ]);
  }
  if (margin >= 30) {
    return pick(seed, [
      winner + " put " + margin.toFixed(1) + " on " + loser + ". That's a missing-person report.",
      loser + " got dog-walked. Don't reply-all. Don't explain. Just sit.",
    ]);
  }
  if (margin >= 15) {
    return pick(seed, [
      winner + " beat the hell out of " + loser + " by " + margin.toFixed(1) + ".",
      loser + " showed up with thoughts and prayers. " + winner + " showed up with points.",
    ]);
  }
  return pick(seed, [
    winner + " took " + loser + " " + high.toFixed(1) + "-" + low.toFixed(1) + ".",
    loser + " had a process. " + winner + " had a scoreboard.",
  ]);
}
