import { getDepartedOwners } from "@/lib/data/departed-owners";
import { DeadManager } from "@/components/admin/dead-manager";

export const metadata = {
  title: "Admin · The Dead",
};

export default async function AdminDeadPage() {
  const { departed, error } = await getDepartedOwners();

  return (
    <div className="space-y-6">
      <header>
        <p className="ff-ribbon">Rest in pieces</p>
        <h1 className="ff-display mt-2 text-3xl tracking-tight">
          Wall of the Dead
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Record owners who left the league. Public page:{" "}
          <a href="/dead" className="font-semibold underline">
            /dead
          </a>
          . Leave empty until someone actually departs — do not invent names.
        </p>
      </header>
      <DeadManager departed={departed} error={error} />
    </div>
  );
}
