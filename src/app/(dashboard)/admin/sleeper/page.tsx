import { SleeperSyncForm } from "@/components/admin/sleeper-sync-form";
import { SLEEPER_DEFAULT_LEAGUE_ID } from "@/lib/sleeper/client";

export const metadata = {
  title: "Admin · Sleeper",
};

export default function AdminSleeperPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="ff-ribbon">Sleeper</p>
        <h1 className="ff-display mt-2 text-3xl tracking-tight">
          Sleeper sync
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Pull league name, users/teams, and standings from Sleeper league{" "}
          <code className="font-mono text-xs">{SLEEPER_DEFAULT_LEAGUE_ID}</code>
          . Public API — no Sleeper login required. Manual button only (no
          background sync yet).
        </p>
      </header>

      <SleeperSyncForm />
    </div>
  );
}
