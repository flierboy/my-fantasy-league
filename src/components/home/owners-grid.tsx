import type { Owner } from "@/lib/types";
import { PlayersView } from "./players-view";

interface OwnersGridProps {
  owners: Owner[];
}

/** Homepage owners section — Fake Football–style player cards. */
export function OwnersGrid({ owners }: OwnersGridProps) {
  return <PlayersView owners={owners} showHeader />;
}
