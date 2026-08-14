import { getPollsData } from "@/lib/data/dashboard";
import { getCurrentOwner } from "@/lib/auth/session";
import { PollCard } from "@/components/dashboard/poll-card";

export const metadata = {
  title: "Polls",
};

export default async function PollsPage() {
  const [{ polls, votes }, owner] = await Promise.all([
    getPollsData(),
    getCurrentOwner(),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <p className="ff-ribbon">Democracy</p>
        <h1 className="ff-display mt-2 text-3xl tracking-tight">Polls</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Vote on league decisions. Commissioners post new polls when something
          needs a league vote.
        </p>
      </header>

      {polls.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border bg-white p-8 text-center">
          <p className="ff-display text-lg">No polls yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Nothing to vote on right now — check back when the commissioner
            drops a question.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {polls.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              votes={votes}
              currentOwnerId={owner?.id ?? null}
              canVote={Boolean(owner)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
