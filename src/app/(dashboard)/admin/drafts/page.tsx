import { getOwners } from "@/lib/data/league";
import { getDraftYears } from "@/lib/data/drafts";
import { DraftsManager } from "@/components/admin/drafts-manager";

export const metadata = {
  title: "Admin · Drafts",
};

export default async function AdminDraftsPage() {
  const [{ years, error }, owners] = await Promise.all([
    getDraftYears({ withPicks: true }),
    getOwners(),
  ]);
  const sortedOwners = [...owners].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-6">
      <header>
        <p className="ff-ribbon">Draft</p>
        <h1 className="ff-display mt-2 text-3xl tracking-tight">
          Draft history
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Manage past drafts (2023 Yahoo, 2024 Yahoo, 2025 ESPN, …). Public
          boards live at{" "}
          <a href="/drafts" className="font-semibold underline">
            /drafts
          </a>
          . Import picks via CSV after creating each year.
        </p>
      </header>
      <DraftsManager years={years} owners={sortedOwners} error={error} />
    </div>
  );
}
