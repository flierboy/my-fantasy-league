# Atmospheric backgrounds

Swap these files anytime (keep the same filenames, or update paths in
`src/lib/backgrounds.ts`).

| File | Used on | Notes |
|------|---------|--------|
| `paycor.mp4` | Homepage only | Paycor Stadium aerial — muted loop, autoplay |
| `stadium-night.jpg` | Dashboard, matchups, dues, admin, constitution, login, home poster | Existing stadium still |
| `metlife-stadium.jpg` | History, Badges, Players | MetLife night / fireworks celebration |
| `tunnel-entrance.jpg` | Optional alternate | Tunnel → field still |
| `homepage-hero.mp4` | (unused backup) | Previous hero clip |

Dark overlay is applied globally in CSS (`.ff-site-bg__overlay`) so paper
cards stay high-contrast on every still/video.

Recommended max sizes: video ~2–8 MB if possible; stills ~200–800 KB.
