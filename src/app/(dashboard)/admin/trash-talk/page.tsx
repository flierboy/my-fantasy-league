import { getTrashTalkData } from "@/lib/data/dashboard";
import { TrashModeration } from "@/components/admin/trash-moderation";

export const metadata = {
  title: "Admin · Moderation",
};

export default async function AdminTrashTalkPage() {
  const { posts } = await getTrashTalkData();

  return (
    <div className="space-y-6">
      <header>
        <p className="ff-ribbon">Moderation</p>
        <h1 className="ff-display mt-2 text-3xl tracking-tight">Trash talk</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Remove posts that violate league norms.
        </p>
      </header>
      <TrashModeration posts={posts} />
    </div>
  );
}
