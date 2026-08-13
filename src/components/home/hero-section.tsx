import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { LeagueSettings } from "@/lib/types";

interface HeroSectionProps {
  league: LeagueSettings;
}

export function HeroSection({ league }: HeroSectionProps) {
  return (
    <section className="flex flex-col items-center text-center">
      <div
        className="mb-5 flex h-[7.5rem] w-[7.5rem] items-center justify-center rounded-2xl border-2 border-foreground bg-white drop-shadow-md sm:mb-6 sm:h-32 sm:w-32"
        style={{ boxShadow: "4px 4px 0 0 #141414" }}
      >
        <span
          className="ff-display text-5xl text-foreground sm:text-6xl"
          aria-hidden
        >
          🏈
        </span>
      </div>

      <h1 className="ff-display ff-display-on-bg text-4xl tracking-tight sm:text-6xl">
        {league.name}
      </h1>

      <div className="ff-ribbon mt-3 sm:mt-4">{league.tagline}</div>

      {/* Paper panel keeps rules + CTA readable on video/still */}
      <div className="ff-card mt-5 max-w-lg px-5 py-4 text-left sm:mt-6 sm:px-6 sm:py-5 sm:text-center">
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          {league.rules_summary}
        </p>
        <div className="mt-5 flex justify-center">
          <Button
            asChild
            className="min-w-[10rem] shadow-[3px_3px_0_0_#141414]"
          >
            <Link href="/login">Enter league</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
