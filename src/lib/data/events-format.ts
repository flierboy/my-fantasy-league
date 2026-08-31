/** Client-safe event date formatting (no server imports). */

/** Format event start in America/New_York for Hub cards / popup. */
export function formatEventWhenEt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "TBD";
  return d.toLocaleString("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

/** Kickoff in America/Chicago (primetime slate). */
export function formatEventWhenCt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "TBD";
  return d.toLocaleString("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

/** Alias used by primetime slate rows. */
export const formatKickoffChicago = formatEventWhenCt;

/** Time only in America/Chicago (day shown separately). */
export function formatKickoffTimeCt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "TBD";
  return d.toLocaleString("en-US", {
    timeZone: "America/Chicago",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

/** Prefer CT for nfl kind; ET otherwise. */
export function formatEventWhen(iso: string, kind?: string | null): string {
  if (kind === "nfl") return formatEventWhenCt(iso);
  return formatEventWhenEt(iso);
}
