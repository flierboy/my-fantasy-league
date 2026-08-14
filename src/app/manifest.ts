import type { MetadataRoute } from "next";

/**
 * Web App Manifest — icons use versioned /icons/ud-v4-* paths
 * (Upper Decker can crest) so browsers drop any previously cached bat art.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Upper Deckcers",
    short_name: "Upper Decker",
    description:
      "Private 10-team fantasy football league — draft countdown, owners, standings, dues, polls, and trash talk.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#000000",
    theme_color: "#000000",
    categories: ["sports", "entertainment"],
    lang: "en-US",
    icons: [
      {
        src: "/icons/ud-v4-48.png",
        sizes: "48x48",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/ud-v4-72.png",
        sizes: "72x72",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/ud-v4-96.png",
        sizes: "96x96",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/ud-v4-128.png",
        sizes: "128x128",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/ud-v4-144.png",
        sizes: "144x144",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/ud-v4-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/ud-v4-256.png",
        sizes: "256x256",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/ud-v4-384.png",
        sizes: "384x384",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/ud-v4-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/ud-v4-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
