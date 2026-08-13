import { getHistoryEntries } from "@/lib/data/history";
import { HistoryManager } from "@/components/admin/history-manager";

export const metadata = {
  title: "Admin · History",
};

export default async function AdminHistoryPage() {
  const { entries, source, empty, error } = await getHistoryEntries();

  // Live DB rows only (never treat fallback placeholders as editable)
  const liveEntries = source === "supabase" ? entries : [];

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
        </p>
        {error && (
          <div className="mt-3 rounded-lg border-2 border-destructive/40 bg-red-50 px-3 py-2 text-sm text-red-950">
            <p className="font-bold">Could not load history_entries</p>
            <p className="mt-1 font-mono text-xs">{error}</p>
          </div>
        )}
        {source === "supabase" && empty && (
          <p className="mt-3 rounded-lg border-2 border-emerald-800/30 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
            Table connected — no entries yet. Create the first one below.
          </p>
        )}
        {source === "placeholder" && !error && (
          <p className="mt-3 rounded-lg border-2 border-amber-600/40 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            Showing offline placeholders. Connect Supabase or check env vars.
          </p>
        )}
      </header>

      <HistoryManager entries={liveEntries} />
    </div>
  );
}
