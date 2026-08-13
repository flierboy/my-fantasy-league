"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { TrashTalkPost } from "@/lib/types";
import { OwnerAvatar } from "@/components/home/owner-avatar";

interface TrashTalkFeedProps {
  initialPosts: TrashTalkPost[];
}

/**
 * Server-rendered posts + client Realtime subscription to refresh on inserts.
 */
export function TrashTalkFeed({ initialPosts }: TrashTalkFeedProps) {
  const [posts, setPosts] = useState(initialPosts);
  const router = useRouter();

  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  useEffect(() => {
    // Browser: only subscribe when public env is available
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      return;
    }

    const supabase = createClient();
    const channel = supabase
      .channel("trash-talk-live")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "trash_talk_posts",
        },
        () => {
          // Re-fetch server component tree for owner joins + consistent order
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router]);

  if (posts.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-border bg-white p-8 text-center text-sm text-muted-foreground">
        No posts yet. Be the first to talk trash.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {posts.map((post) => {
        const name = post.owner?.display_name ?? "Unknown";
        return (
          <li
            key={post.id}
            className="rounded-xl border-2 border-foreground bg-white p-4 shadow-sm sm:p-5"
          >
            <div className="flex items-start gap-3">
              <OwnerAvatar
                name={name}
                src={post.owner?.avatar_url}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="ff-display text-sm">{name}</span>
                  <time
                    className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                    dateTime={post.created_at}
                  >
                    {new Date(post.created_at).toLocaleString()}
                  </time>
                </div>
                <p className="mt-1.5 text-[15px] leading-relaxed whitespace-pre-wrap">
                  {post.body}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
