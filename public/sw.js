/* Upper Deckcers — basic service worker
 * - Precaches app shell assets for faster / offline-ish loads
 * - Network-first for navigations (fresh league data when online)
 * - Cache-first for static Next assets and icons
 * Scope: / (this file lives at /sw.js)
 */

const CACHE_VERSION = "ud-shell-v1";
const PRECACHE = [
  "/",
  "/offline.html",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_VERSION)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

/**
 * Skip caching for auth, APIs, and third-party (Supabase, etc.).
 */
function shouldBypass(url) {
  if (url.origin !== self.location.origin) return true;
  const path = url.pathname;
  if (path.startsWith("/auth/")) return true;
  if (path.startsWith("/api/")) return true;
  // Large media — don't fill cache
  if (path.startsWith("/backgrounds/")) return true;
  if (/\.(mp4|webm|mov)$/i.test(path)) return true;
  return false;
}

function isStaticAsset(url) {
  const path = url.pathname;
  return (
    path.startsWith("/_next/static/") ||
    path.startsWith("/icons/") ||
    path === "/favicon.ico" ||
    path === "/manifest.webmanifest" ||
    /\.(png|jpg|jpeg|gif|webp|svg|ico|woff2?)$/i.test(path)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (shouldBypass(url)) return;

  // Navigations: network-first, fall back to cache / offline page
  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  // Next static + icons: cache-first
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Other same-origin GETs: network-first with cache fallback
  event.respondWith(networkFirst(request));
});

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    const offline = await caches.match("/offline.html");
    return offline || new Response("Offline", { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return (
      cached ||
      new Response("Offline", {
        status: 503,
        statusText: "Offline",
      })
    );
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}
