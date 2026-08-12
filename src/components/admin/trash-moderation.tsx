"use client";

import type { TrashTalkPost } from "@/lib/types";
import { deleteTrashTalkPost } from "@/lib/actions/admin/trash-talk";
import { ActionForm } from "./action-form";
import { SubmitButton } from "./submit-button";
import { OwnerAvatar } from "@/components/home/owner-avatar";

export function TrashModeration({ posts }: { posts: TrashTalkPost[] }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Delete posts that cross the line. This cannot be undone.
      </p>
      {posts.length === 0 && (
        <p className="rounded-xl border-2 border-dashed border-border p-6 text-sm text-muted-foreground">
          No trash talk posts.
        </p>
      )}
      {posts.map((post) => {
        const name = post.owner?.display_name ?? "Unknown";
        return (
          <article
            key={post.id}
            className="rounded-xl border-2 border-foreground bg-white p-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <OwnerAvatar name={name} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="ff-display text-sm">{name}</span>
                  <time className="text-[11px] font-semibold uppercase text-muted-foreground">
                    {new Date(post.created_at).toLocaleString()}
                  </time>
                </div>
                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed">
                  {post.body}
                </p>
                <ActionForm action={deleteTrashTalkPost} className="mt-3">
                  <input type="hidden" name="id" value={post.id} />
                  <SubmitButton variant="outline">Delete post</SubmitButton>
                </ActionForm>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
