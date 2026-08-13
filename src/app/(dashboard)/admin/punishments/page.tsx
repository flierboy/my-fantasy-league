import { getOwners } from "@/lib/data/league";
import { getPunishments } from "@/lib/data/punishments";
import { PunishmentsManager } from "@/components/admin/punishments-manager";

export const metadata = {
  title: "Admin · Punishments",
};

export default async function AdminPunishmentsPage() {
  const [{ punishments, error }, owners] = await Promise.all([
    getPunishments(),
    getOwners(),
  ]);
  const sortedOwners = [...owners].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-6">
      <header>
        <p className="ff-ribbon">Wall of shame</p>
        <h1 className="ff-display mt-2 text-3xl tracking-tight">
          Punishments
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Record past last-place gauntlets and other horrors. Public page:{" "}
          <a href="/punishments" className="font-semibold underline">
            /punishments
          </a>
          .
        </p>
      </header>
      <PunishmentsManager
        punishments={punishments}
        owners={sortedOwners}
        error={error}
      />
    </div>
  );
}
