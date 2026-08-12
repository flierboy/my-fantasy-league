import { getLeagueSettings } from "@/lib/data/league";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata = {
  title: "Admin · Settings",
};

export default async function AdminSettingsPage() {
  const league = await getLeagueSettings();

  return (
    <div className="space-y-6">
      <header>
        <p className="ff-ribbon">League</p>
        <h1 className="ff-display mt-2 text-3xl tracking-tight">Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Homepage copy, season year, dues amount, and trophy text.
        </p>
      </header>
      <SettingsForm league={league} />
    </div>
  );
}
