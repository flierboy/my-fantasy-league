import { getOwners } from "@/lib/data/league";
import { getPastSeasons } from "@/lib/data/seasons";
import { SeasonsManager } from "@/components/admin/seasons-manager";

export const metadata = {
  title: "Admin · Past seasons",
};

export default async function AdminSeasonsPage() {
  const [{ seasons, error }, owners] = await Promise.all([
    getPastSeasons({ withStandings: true }),
    getOwners(),
  ]);
  const sortedOwners = [...owners].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-6">
      <header>
        <p className="ff-ribbon">Legacy</p>
        <h1 className="ff-display mt-2 text-3xl tracking-tight">
          Past seasons
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Manual standings for completed years (2023, 2024, …). Champion and
          runner-up highlight on public History. Owners get finishes on their
          profiles.
        </p>
      </header>
      <SeasonsManager
        seasons={seasons}
        owners={sortedOwners}
        error={error}
      />
    </div>
  );
}
