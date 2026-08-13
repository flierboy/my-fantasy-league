/**
 * Atmospheric background asset paths — swap files under /public/backgrounds/
 * or change these constants.
 */
export const BG = {
  /** Homepage looping video (muted, no audio track preferred) */
  homepageVideo: "/backgrounds/homepage-hero.mp4",
  /** Static stadium night still — all non-home pages + video poster/fallback */
  stadiumStill: "/backgrounds/stadium-night.jpg",
  /** Tunnel still (optional poster / alternate fallback) */
  tunnelStill: "/backgrounds/tunnel-entrance.jpg",
} as const;
