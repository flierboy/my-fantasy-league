import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { LeagueSettings } from "@/lib/types";

interface HeroSectionProps {
  league: LeagueSettings;
}

export function HeroSection({ league }: HeroSectionProps) {
  return (
    <section className="flex flex-col items-center text-center">
      {/* League mark — replace with your logo later */}
      <div className="mb-4 flex h-[7.5rem] w-[7.5rem] items-center justify-center rounded-2xl border-2 border-foreground bg-white shadow-md drop-shadow-md sm:h-32 sm:w-32">
        <span className="ff-display text-4xl text-foreground sm:text-5xl" aria-hidden>
          🏈
        </span>
      </div>

      <h1 className="ff-display text-4xl tracking-tight sm:text-6xl">
        {league.name}
      </h1>

      <div className="ff-ribbon mt-3">{league.tagline}</div>

      <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
        {league.rules_summary}
      </p>

      <div className="mt-6">
        <Button asChild>
          <Link href="/login">Enter league</Link>
        </Button>
      </div>
    </section>
  );
}
