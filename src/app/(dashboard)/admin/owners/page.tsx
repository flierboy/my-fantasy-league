import { getOwners } from "@/lib/data/league";
import { OwnersManager } from "@/components/admin/owners-manager";

export const metadata = {
  title: "Admin · Owners",
};

export default async function AdminOwnersPage() {
  const owners = await getOwners();
  const sorted = [...owners].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-6">
      <header>
        <p className="ff-ribbon">Roster</p>
        <h1 className="ff-display mt-2 text-3xl tracking-tight">Owners</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Edit names, all-time W-L, prize money, badges, draft order, admin flag,
          and auth user links.
        </p>
      </header>
      <OwnersManager owners={sorted} />
    </div>
  );
}
