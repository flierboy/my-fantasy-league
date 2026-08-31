/**
 * @deprecated Prefer @/lib/nfl/scoreboard — full weekly slate.
 * Thin re-exports kept so old imports do not break mid-refactor.
 */

export {
  getNflWeekScoreboard as getPrimetimeSlate,
  type NflGame as PrimetimeGame,
  type NflWeekScoreboard as PrimetimeSlate,
} from "@/lib/nfl/scoreboard";

export { formatKickoffChicago } from "@/lib/data/events-format";
