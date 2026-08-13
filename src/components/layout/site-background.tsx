"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { BG, stillForPath } from "@/lib/backgrounds";

/**
 * Full-bleed atmospheric background behind all content.
 * - Homepage: muted looping Paycor Stadium video (desktop + mobile)
 * - Other pages: route-based stadium stills (classic night vs MetLife)
 * - Reduced motion on home: stadium still only
 * pointer-events: none — never blocks UI clicks
 */
export function SiteBackground() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    if (!isHome) {
      setShowVideo(false);
      return;
    }

    const preferReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (preferReduced) {
      setShowVideo(false);
      return;
    }

    const v = videoRef.current;
    if (!v) return;

    v.muted = true;
    v.defaultMuted = true;
    v.playsInline = true;

    const tryPlay = () => {
      void v
        .play()
        .then(() => setShowVideo(true))
        .catch(() => setShowVideo(false));
    };

    if (v.readyState >= 2) tryPlay();
    else v.addEventListener("loadeddata", tryPlay, { once: true });

    return () => {
      v.removeEventListener("loadeddata", tryPlay);
    };
  }, [isHome]);

  const stillSrc = isHome ? BG.stadiumStill : stillForPath(pathname);

  return (
    <div className="ff-site-bg" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={stillSrc}
        src={stillSrc}
        alt=""
        className="ff-site-bg__still"
        decoding="async"
        fetchPriority={isHome ? "high" : "auto"}
      />

      {isHome && (
        <video
          ref={videoRef}
          className={
            showVideo ? "ff-site-bg__video is-active" : "ff-site-bg__video"
          }
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={BG.stadiumStill}
          onError={() => setShowVideo(false)}
        >
          <source src={BG.homepageVideo} type="video/mp4" />
        </video>
      )}

      {/* Same strong dark overlay on every page for card/text contrast */}
      <div className="ff-site-bg__overlay" />
    </div>
  );
}
