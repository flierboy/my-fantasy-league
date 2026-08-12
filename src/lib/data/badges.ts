import type { Badge, BadgeKey } from "@/lib/types";

/** Canonical badge definitions — hall of badges + owner chips. */
export const BADGES: Record<BadgeKey, Badge> = {
  champion: {
    key: "champion",
    label: "Champion",
    emoji: "🏆",
    description:
      "Won the league championship. The hardware. The glory. Forever.",
    className:
      "border-foreground bg-gradient-to-br from-accent-gold to-yellow-300 text-foreground",
  },
  commissioner: {
    key: "commissioner",
    label: "Commissioner",
    emoji: "⚖️",
    description: "Runs the league. Makes the rules. Settles the beef.",
    className:
      "border-foreground bg-gradient-to-br from-slate-700 to-slate-900 text-white",
  },
  rookie: {
    key: "rookie",
    label: "Rookie",
    emoji: "🆕",
    description: "First year in the league. Fresh meat.",
    className:
      "border-emerald-900 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white",
  },
  punished: {
    key: "punished",
    label: "Punished",
    emoji: "☠️",
    description: "Finished last. Paid the price. Still here.",
    className:
      "border-foreground bg-gradient-to-br from-red-700 to-red-900 text-white",
  },
  it: {
    key: "it",
    label: "IT",
    emoji: "💻",
    description:
      "Keeps the lights on. Builds the site. Fixes the broken stuff.",
    className:
      "border-foreground bg-gradient-to-br from-sky-500 to-blue-700 text-white",
  },
  runner_up: {
    key: "runner_up",
    label: "Runner-up",
    emoji: "🥈",
    description: "Made the final. Didn't win the hardware.",
    className:
      "border-foreground bg-gradient-to-br from-zinc-300 to-zinc-400 text-foreground",
  },
  toilet: {
    key: "toilet",
    label: "Toilet Bowl",
    emoji: "🚽",
    description: "Won the toilet bowl. Still lost the season.",
    className:
      "border-foreground bg-gradient-to-br from-amber-700 to-amber-900 text-white",
  },
  draft_guru: {
    key: "draft_guru",
    label: "Draft Guru",
    emoji: "🎯",
    description:
      "Crushed the draft board. Steals, value, and zero busts (allegedly).",
    className:
      "border-indigo-900 bg-gradient-to-br from-indigo-400 to-indigo-700 text-white",
  },
  iron_man: {
    key: "iron_man",
    label: "Iron Man",
    emoji: "💪",
    description: "Never missed a set. Never missed a trash talk. Always online.",
    className:
      "border-orange-900 bg-gradient-to-br from-orange-400 to-orange-700 text-white",
  },
  high_scorer: {
    key: "high_scorer",
    label: "High Scorer",
    emoji: "🔥",
    description: "Led the league in points scored. Absolute unit.",
    className:
      "border-rose-900 bg-gradient-to-br from-rose-400 to-rose-700 text-white",
  },
};

export const BADGE_LIST = Object.values(BADGES);

export function getBadge(key: BadgeKey): Badge {
  return BADGES[key];
}
