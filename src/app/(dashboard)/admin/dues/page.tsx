import { getDuesData } from "@/lib/data/dashboard";
import { DuesManager } from "@/components/admin/dues-manager";

export const metadata = {
  title: "Admin · Dues",
};

export default async function AdminDuesPage() {
  const data = await getDuesData();

  return (
    <div className="space-y-6">
      <header>
        <p className="ff-ribbon">Money</p>
        <h1 className="ff-display mt-2 text-3xl tracking-tight">Dues</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Mark paid/unpaid, edit amounts and notes for season {data.season}.
        </p>
      </header>
      <DuesManager
        league={data.league}
        payments={data.payments}
        season={data.season}
      />
    </div>
  );
}
