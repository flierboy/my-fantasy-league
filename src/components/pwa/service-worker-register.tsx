"use client";

import { useEffect } from "react";

/**
 * Registers the PWA service worker in production builds.
 * Skipped in development so Turbopack/HMR is not interfered with.
 * Set NEXT_PUBLIC_PWA_DEV=1 to test registration locally.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const allowDev = process.env.NEXT_PUBLIC_PWA_DEV === "1";
    if (process.env.NODE_ENV !== "production" && !allowDev) return;

    let updateTimer: number | undefined;

    const onLoad = () => {
      navigator.serviceWorker
        // Query string forces browsers to re-fetch after cache-name bumps
        .register("/sw.js?v=ud-shell-v4-crest", { scope: "/" })
        .then((reg) => {
          updateTimer = window.setInterval(() => {
            void reg.update();
          }, 60 * 60 * 1000);
        })
        .catch((err) => {
          console.info("[pwa] service worker registration skipped:", err);
        });
    };

    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad);

    return () => {
      window.removeEventListener("load", onLoad);
      if (updateTimer != null) window.clearInterval(updateTimer);
    };
  }, []);

  return null;
}
