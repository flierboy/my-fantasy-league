import { getTrashTalkData } from "@/lib/data/dashboard";
import { getCurrentOwner } from "@/lib/auth/session";
import { TrashTalkComposer } from "@/components/dashboard/trash-talk-composer";
import { TrashTalkFeed } from "@/components/dashboard/trash-talk-feed";

export const metadata = {
  title: "Trash talk",
};

export default async function TrashTalkPage() {
  const [{ posts, source }, owner] = await Promise.all([
    getTrashTalkData(),
    getCurrentOwner(),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <p className="ff-ribbon">Smack</p>
        <h1 className="ff-display mt-2 text-3xl tracking-tight">Trash talk</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          League message board
          {source === "supabase"
            ? " · live Supabase + Realtime refresh"
            : ""}
          .
        </p>
      </header>

      <TrashTalkComposer canPost={Boolean(owner)} />
      <TrashTalkFeed initialPosts={posts} />
    </div>
  );
}
