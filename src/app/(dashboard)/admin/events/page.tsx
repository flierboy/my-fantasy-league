import { getLeagueEvents } from "@/lib/data/events";
import { EventsManager } from "@/components/admin/events-manager";

export const metadata = {
  title: "Admin · Events",
};

export default async function AdminEventsPage() {
  const { events, error } = await getLeagueEvents();

  return (
    <div className="space-y-6">
      <header>
        <p className="ff-ribbon">Calendar</p>
        <h1 className="ff-display mt-2 text-3xl tracking-tight">Events</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Upcoming league events for Hub. Migration seeds{" "}
          <strong>UFD Draft</strong> (Sun Aug 30, 2026 · 3:45 PM ET) when the
          table is empty. Run{" "}
          <code className="font-mono text-xs">
            supabase/migrate-league-events.sql
          </code>
          .
        </p>
      </header>
      <EventsManager events={events} error={error} />
    </div>
  );
}
