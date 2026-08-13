import type { Badge, BadgeCategory, BadgeKey } from "@/lib/types";

/** Display order + labels for badge hall / admin groups */
export const BADGE_CATEGORIES: {
  id: BadgeCategory;
  label: string;
  blurb: string;
}[] = [
  {
    id: "season",
    label: "Season awards",
    blurb: "Championship hardware, roles, and season-long honors",
  },
  {
    id: "draft_strategic",
    label: "Draft · Strategic",
    blurb: "Board mastery, value, and pre-draft prophecy",
  },
  {
    id: "draft_cautionary",
    label: "Draft · Cautionary",
    blurb: "Reaches, autodraft, and lessons learned the hard way",
  },
  {
    id: "weekly_top",
    label: "Weekly · Top performers",
    blurb: "Dominators, margins, and statement wins",
  },
  {
    id: "weekly_heartbreak",
    label: "Weekly · Heartbreak",
    blurb: "Bench crimes, near-misses, and pain",
  },
  {
    id: "weekly_specialty",
    label: "Weekly · Specialty",
    blurb: "MNF magic, waivers, kickers, and defense",
  },
  {
    id: "legacy",
    label: "Legacy",
    blurb: "Classic league badges still on the books",
  },
];

const chip = {
  gold: "border-foreground bg-gradient-to-br from-accent-gold to-yellow-300 text-foreground",
  ink: "border-foreground bg-gradient-to-br from-slate-700 to-slate-900 text-white",
  red: "border-foreground bg-gradient-to-br from-red-700 to-red-900 text-white",
  sky: "border-foreground bg-gradient-to-br from-sky-500 to-blue-700 text-white",
  emerald:
    "border-emerald-900 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white",
  zinc: "border-foreground bg-gradient-to-br from-zinc-300 to-zinc-400 text-foreground",
  rose: "border-rose-900 bg-gradient-to-br from-rose-400 to-rose-700 text-white",
  indigo:
    "border-indigo-900 bg-gradient-to-br from-indigo-400 to-indigo-700 text-white",
  violet:
    "border-violet-900 bg-gradient-to-br from-violet-400 to-violet-700 text-white",
  cyan: "border-cyan-900 bg-gradient-to-br from-cyan-400 to-cyan-700 text-white",
  teal: "border-teal-900 bg-gradient-to-br from-teal-400 to-teal-700 text-white",
  amber:
    "border-foreground bg-gradient-to-br from-amber-600 to-amber-900 text-white",
  orange:
    "border-orange-900 bg-gradient-to-br from-orange-400 to-orange-700 text-white",
  lime: "border-lime-900 bg-gradient-to-br from-lime-400 to-lime-600 text-foreground",
  pink: "border-pink-900 bg-gradient-to-br from-pink-400 to-pink-700 text-white",
  fuchsia:
    "border-fuchsia-900 bg-gradient-to-br from-fuchsia-400 to-fuchsia-700 text-white",
  stone:
    "border-foreground bg-gradient-to-br from-stone-500 to-stone-800 text-white",
  yellow:
    "border-yellow-900 bg-gradient-to-br from-yellow-300 to-yellow-500 text-foreground",
} as const;

/** Canonical badge definitions — hall of badges + owner chips. */
export const BADGES: Record<BadgeKey, Badge> = {
  // ── Season awards ──────────────────────────────────────────────
  champion: {
    key: "champion",
    label: "Champion",
    emoji: "🏆",
    description:
      "Won the league championship. The hardware. The glory. Forever.",
    category: "season",
    className: chip.gold,
  },
  punished: {
    key: "punished",
    label: "Punished",
    emoji: "☠️",
    description:
      "Lowest points through the gauntlet — voted punishment. Wear the skull with pride.",
    category: "season",
    className: chip.red,
  },
  commissioner: {
    key: "commissioner",
    label: "Commissioner",
    emoji: "⚖️",
    description: "Runs the league — rules, drama, and the final word.",
    category: "season",
    className: chip.ink,
  },
  it: {
    key: "it",
    label: "IT",
    emoji: "💻",
    description:
      "Keeps the clubhouse online — sites, syncs, and mysterious green lights.",
    category: "season",
    className: chip.sky,
  },
  rookie: {
    key: "rookie",
    label: "Rookie",
    emoji: "🆕",
    description: "First season in the league. Fresh meat.",
    category: "season",
    className: chip.emerald,
  },
  runner_up: {
    key: "runner_up",
    label: "Runner-Up",
    emoji: "🥈",
    description: "Finished second.",
    category: "season",
    className: chip.zinc,
  },
  regular_season_champ: {
    key: "regular_season_champ",
    label: "Regular Season Champ",
    emoji: "📊",
    description: "Best record before the playoffs.",
    category: "season",
    className: chip.indigo,
  },
  high_scorer: {
    key: "high_scorer",
    label: "High Scorer",
    emoji: "🔥",
    description: "Most points scored in a season.",
    category: "season",
    className: chip.rose,
  },
  founding_member: {
    key: "founding_member",
    label: "OG / Founding Member",
    emoji: "🏛️",
    description: "In the league since 2023.",
    category: "season",
    className: chip.amber,
  },

  // ── Draft · Strategic ──────────────────────────────────────────
  draft_guru: {
    key: "draft_guru",
    label: "Draft Guru",
    emoji: "🧠",
    description:
      "Highest draft grade or projected standings score post-draft.",
    category: "draft_strategic",
    className: chip.indigo,
  },
  sleeper_sniper: {
    key: "sleeper_sniper",
    label: "Sleeper Sniper",
    emoji: "🎯",
    description:
      "Drafted a player in round 8+ who finished top-15 at their position.",
    category: "draft_strategic",
    className: chip.violet,
  },
  value_hunter: {
    key: "value_hunter",
    label: "Value Hunter",
    emoji: "💎",
    description:
      "Selected the player with the highest positive ADP differential.",
    category: "draft_strategic",
    className: chip.cyan,
  },
  position_stack_king: {
    key: "position_stack_king",
    label: "Position Stack King",
    emoji: "🔗",
    description:
      "Drafted a marquee QB and primary WR/TE pairing early.",
    category: "draft_strategic",
    className: chip.teal,
  },
  rookie_whisperer: {
    key: "rookie_whisperer",
    label: "Rookie Whisperer",
    emoji: "🐣",
    description: "Picked the highest-scoring rookie in the draft.",
    category: "draft_strategic",
    className: chip.lime,
  },
  gridiron_nostradamus: {
    key: "gridiron_nostradamus",
    label: "Gridiron Nostradamus",
    emoji: "🔮",
    description:
      "Called out a mid-round breakout in draft chat before the pick.",
    category: "draft_strategic",
    className: chip.fuchsia,
  },

  // ── Draft · Cautionary ─────────────────────────────────────────
  reach_of_the_year: {
    key: "reach_of_the_year",
    label: "Reach of the Year",
    emoji: "🦒",
    description:
      "Drafted a player several rounds earlier than consensus ADP.",
    category: "draft_cautionary",
    className: chip.orange,
  },
  auto_draft_hero: {
    key: "auto_draft_hero",
    label: "Auto-Draft Hero",
    emoji: "🤖",
    description:
      "Let the algorithm autodraft — and somehow fielded a decent squad.",
    category: "draft_cautionary",
    className: chip.stone,
  },
  injury_magnet: {
    key: "injury_magnet",
    label: "Injury Magnet",
    emoji: "🩹",
    description:
      "Drafted multiple players who hit Week 1 IR / injury report.",
    category: "draft_cautionary",
    className: chip.pink,
  },
  homer_award: {
    key: "homer_award",
    label: "Homer Award",
    emoji: "🏠",
    description:
      "Drafted 3+ players from their favorite real-life NFL team.",
    category: "draft_cautionary",
    className: chip.yellow,
  },
  kicker_in_the_9th: {
    key: "kicker_in_the_9th",
    label: "Kicker in the 9th",
    emoji: "🦵",
    description: "Selected a kicker or defense way too early.",
    category: "draft_cautionary",
    className: chip.amber,
  },

  // ── Weekly · Top performers ────────────────────────────────────
  apex_predator: {
    key: "apex_predator",
    label: "Apex Predator",
    emoji: "🦖",
    description: "Highest total points scored in the league for the week.",
    category: "weekly_top",
    className: chip.rose,
  },
  blowout_machine: {
    key: "blowout_machine",
    label: "Blowout Machine",
    emoji: "💥",
    description: "Largest margin of victory in the league for the week.",
    category: "weekly_top",
    className: chip.orange,
  },
  heavy_hitter: {
    key: "heavy_hitter",
    label: "Heavy Hitter",
    emoji: "🔨",
    description:
      "Single starting player scored the most individual points that week.",
    category: "weekly_top",
    className: chip.red,
  },
  bench_depth_flex: {
    key: "bench_depth_flex",
    label: "Bench Depth Flex",
    emoji: "💪",
    description:
      "Highest combined points across all starting roster spots.",
    category: "weekly_top",
    className: chip.emerald,
  },
  upset_artist: {
    key: "upset_artist",
    label: "Upset Artist",
    emoji: "🎭",
    description:
      "Lowest-ranked team that beat the week's top seed or projection.",
    category: "weekly_top",
    className: chip.violet,
  },

  // ── Weekly · Heartbreak ────────────────────────────────────────
  bench_blunder: {
    key: "bench_blunder",
    label: "Bench Blunder",
    emoji: "🪑",
    description:
      "Left the most points on the bench (or a bench player outscored a starter).",
    category: "weekly_heartbreak",
    className: chip.stone,
  },
  heartbreak_kid: {
    key: "heartbreak_kid",
    label: "Heartbreak Kid",
    emoji: "💔",
    description:
      "Scored the 2nd-highest points in the league — and still lost.",
    category: "weekly_heartbreak",
    className: chip.pink,
  },
  squeaked_by: {
    key: "squeaked_by",
    label: "Squeaked By",
    emoji: "🤏",
    description: "Won a weekly matchup by less than 1.0 point.",
    category: "weekly_heartbreak",
    className: chip.lime,
  },
  punching_bag: {
    key: "punching_bag",
    label: "Punching Bag",
    emoji: "🥊",
    description: "Surrendered the highest points against in a single week.",
    category: "weekly_heartbreak",
    className: chip.red,
  },
  bye_week_blunder: {
    key: "bye_week_blunder",
    label: "Bye Week Blunder",
    emoji: "💤",
    description: "Started a player on bye or listed as inactive.",
    category: "weekly_heartbreak",
    className: chip.ink,
  },

  // ── Weekly · Specialty ─────────────────────────────────────────
  monday_night_miracle: {
    key: "monday_night_miracle",
    label: "Monday Night Miracle",
    emoji: "🌙",
    description:
      "Came back to win on MNF after trailing going into the game.",
    category: "weekly_specialty",
    className: chip.indigo,
  },
  waiver_wire_wizard: {
    key: "waiver_wire_wizard",
    label: "Waiver Wire Wizard",
    emoji: "🪄",
    description:
      "Waiver claim acquisition produced the highest point total of the week.",
    category: "weekly_specialty",
    className: chip.fuchsia,
  },
  defense_wins: {
    key: "defense_wins",
    label: "Defense Wins Championships",
    emoji: "🛡️",
    description: "DST unit put up the highest points of the week.",
    category: "weekly_specialty",
    className: chip.sky,
  },
  clutch_kicker: {
    key: "clutch_kicker",
    label: "Clutch Kicker",
    emoji: "🥅",
    description:
      "Kicker scored 15+ points or provided the deciding margin of victory.",
    category: "weekly_specialty",
    className: chip.teal,
  },

  // ── Legacy ─────────────────────────────────────────────────────
  toilet: {
    key: "toilet",
    label: "Toilet Bowl",
    emoji: "🚽",
    description: "Won the toilet bowl. Still lost the season.",
    category: "legacy",
    className: chip.amber,
  },
  iron_man: {
    key: "iron_man",
    label: "Iron Man",
    emoji: "🦾",
    description:
      "Never missed a set. Never missed a trash talk. Always online.",
    category: "legacy",
    className: chip.orange,
  },
};

/** Ordered list for UI (category order × definition order). */
export const BADGE_LIST: Badge[] = BADGE_CATEGORIES.flatMap((cat) =>
  Object.values(BADGES).filter((b) => b.category === cat.id)
);

/** All valid keys — used when reading/writing owners.badges. */
export const BADGE_KEYS = new Set<BadgeKey>(
  Object.keys(BADGES) as BadgeKey[]
);

export function getBadge(key: BadgeKey | string): Badge {
  if (key in BADGES) return BADGES[key as BadgeKey];
  return {
    key: key as BadgeKey,
    label: String(key),
    emoji: "🏅",
    description: "Custom or retired badge.",
    category: "legacy",
    className: chip.zinc,
  };
}

export function badgesByCategory(): {
  category: (typeof BADGE_CATEGORIES)[number];
  badges: Badge[];
}[] {
  return BADGE_CATEGORIES.map((category) => ({
    category,
    badges: BADGE_LIST.filter((b) => b.category === category.id),
  })).filter((g) => g.badges.length > 0);
}
