import Link from "next/link";
import { getOwners } from "@/lib/data/league";
import { OwnersBulkEditor } from "@/components/admin/owners-bulk-editor";

export const metadata = {
  title: "Admin · Bulk owners",
};

export default async function AdminOwnersBulkPage() {
  const owners = await getOwners();
  const sorted = [...owners].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-6">
      <header>
        <p className="ff-ribbon">Roster</p>
        <h1 className="ff-display mt-2 text-3xl tracking-tight">
          Bulk owner editor
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Set up the whole league in one pass — names, teams, emails, avatars,
          roles, career cash, favorite NFL team, admin flags, and Sleeper match
          names.
        </p>
        <p className="mt-3">
          <Link
            href="/admin/owners"
            className="text-sm font-bold text-foreground underline-offset-2 hover:underline"
          >
            ← Detailed owner editor (W-L, badges, auth UUID)
          </Link>
        </p>
      </header>

      {sorted.length === 0 ? (
        <div className="ff-card p-5 text-sm text-muted-foreground">
          No owners found. Run the seed SQL or add owners on the detail page
          first.
        </div>
      ) : (
        <OwnersBulkEditor owners={sorted} />
      )}
    </div>
  );
}
