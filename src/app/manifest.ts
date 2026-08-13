import type { MetadataRoute } from "next";

/**
 * Web App Manifest — icons use versioned /icons/ud-v3-* paths
 * so browsers drop any previously cached placeholder art.
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
        src: "/icons/ud-v3-48.png",
        sizes: "48x48",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/ud-v3-72.png",
        sizes: "72x72",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/ud-v3-96.png",
        sizes: "96x96",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/ud-v3-128.png",
        sizes: "128x128",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/ud-v3-144.png",
        sizes: "144x144",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/ud-v3-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/ud-v3-256.png",
        sizes: "256x256",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/ud-v3-384.png",
        sizes: "384x384",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/ud-v3-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/ud-v3-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
