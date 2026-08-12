import type { Badge, BadgeKey } from "@/lib/types";

/** Canonical badge definitions used on the public owners grid and draft order. */
export const BADGES: Record<BadgeKey, Badge> = {
  champion: {
    key: "champion",
    label: "Champion",
    emoji: "🏆",
    description: "Won the league championship. The hardware. The glory. Forever.",
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
    description: "Keeps the lights on. Builds the site. Fixes the broken stuff.",
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
};

export function getBadge(key: BadgeKey): Badge {
  return BADGES[key];
}
