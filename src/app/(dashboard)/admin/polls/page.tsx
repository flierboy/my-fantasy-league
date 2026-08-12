import { getPollsData } from "@/lib/data/dashboard";
import { PollsManager } from "@/components/admin/polls-manager";

export const metadata = {
  title: "Admin · Polls",
};

export default async function AdminPollsPage() {
  const { polls, votes } = await getPollsData();

  return (
    <div className="space-y-6">
      <header>
        <p className="ff-ribbon">Democracy</p>
        <h1 className="ff-display mt-2 text-3xl tracking-tight">Polls</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Create polls, open/close voting, and view results.
        </p>
      </header>
      <PollsManager polls={polls} votes={votes} />
    </div>
  );
}
