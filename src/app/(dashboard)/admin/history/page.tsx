import { getHistoryEntries } from "@/lib/data/history";
import { HistoryManager } from "@/components/admin/history-manager";

export const metadata = {
  title: "Admin · History",
};

export default async function AdminHistoryPage() {
  const { entries, source } = await getHistoryEntries();

  // Don't show pure fallback placeholder rows as "editable" DB rows
  const liveEntries =
    source === "supabase"
      ? entries
      : entries.filter((e) => !e.id.startsWith("fallback-"));

  return (
    <div className="space-y-6">
      <header>
        <p className="ff-ribbon">Legacy</p>
        <h1 className="ff-display mt-2 text-3xl tracking-tight">History</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Add past champions, milestones, all-time records, and free-form notes.
          They appear on the public{" "}
          <a href="/history" className="font-semibold underline">
            /history
          </a>{" "}
          page.
          {source === "placeholder" && (
            <span className="mt-2 block rounded-lg border-2 border-amber-600/40 bg-amber-50 px-3 py-2 text-amber-950">
              Database table not found or empty. Run{" "}
              <code className="font-mono text-xs">
                supabase/migrate-history-entries.sql
              </code>{" "}
              in the Supabase SQL Editor, then refresh.
            </span>
          )}
        </p>
      </header>

      <HistoryManager entries={liveEntries} />
    </div>
  );
}
