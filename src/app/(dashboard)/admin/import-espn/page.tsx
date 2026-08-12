import { EspnImportForm } from "@/components/admin/espn-import-form";
import {
  ESPN_DEFAULT_LEAGUE_ID,
  ESPN_DEFAULT_SEASON,
} from "@/lib/espn/client";

export const metadata = {
  title: "Admin · ESPN Import",
};

export default function AdminImportEspnPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="ff-ribbon">One-time</p>
        <h1 className="ff-display mt-2 text-3xl tracking-tight">
          ESPN import
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Historical pull from ESPN Fantasy league{" "}
          <strong>{ESPN_DEFAULT_LEAGUE_ID}</strong>, target season{" "}
          <strong>{ESPN_DEFAULT_SEASON}</strong>. That season is private on the
          API (401 without auth) — use <strong>espn_s2</strong> +{" "}
          <strong>SWID</strong> cookies from a logged-in ESPN member session.
          Admin only. Not a live sync.
        </p>
      </header>

      <EspnImportForm />
    </div>
  );
}
