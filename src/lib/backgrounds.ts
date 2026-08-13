/**
 * Atmospheric background asset paths — swap files under /public/backgrounds/
 * or change these constants.
 */
export const BG = {
  /** Homepage looping video — Paycor Stadium aerial (muted) */
  homepageVideo: "/backgrounds/paycor.mp4",
  /** Primary stadium still (existing site atmosphere) */
  stadiumStill: "/backgrounds/stadium-night.jpg",
  /** MetLife Stadium night / fireworks celebration still */
  metlifeStill: "/backgrounds/metlife-stadium.jpg",
  /** Tunnel still (optional poster / alternate fallback) */
  tunnelStill: "/backgrounds/tunnel-entrance.jpg",
} as const;

/**
 * Pick a full-bleed still by route so pages don't all look identical.
 * Homepage still is only the poster/fallback under Paycor video.
 */
export function stillForPath(pathname: string): string {
  // Celebration / trophy lore
  if (
    pathname.startsWith("/history") ||
    pathname.startsWith("/badges") ||
    pathname.startsWith("/players")
  ) {
    return BG.metlifeStill;
  }

  // Default operational + private area atmosphere
  // (dashboard, matchups, dues, polls, admin, constitution, login, …)
  return BG.stadiumStill;
}
