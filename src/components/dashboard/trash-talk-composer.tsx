"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createTrashTalkPost } from "@/lib/actions/trash-talk";

interface TrashTalkComposerProps {
  canPost: boolean;
}

/**
 * Posts to Supabase trash_talk_posts via server action.
 * Requires owners.user_id linked to the signed-in user.
 */
export function TrashTalkComposer({ canPost }: TrashTalkComposerProps) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !canPost) return;
    setError(null);
    startTransition(async () => {
      const result = await createTrashTalkPost(body);
      if (!result.ok) {
        setError(result.error ?? "Failed to post");
        return;
      }
      setBody("");
    });
  }

  if (!canPost) {
    return (
      <div className="rounded-xl border-2 border-amber-600/40 bg-amber-50 p-4 text-sm text-amber-950">
        Link your auth user to an owner row (
        <code className="font-mono text-xs">owners.user_id</code>) before
        posting.
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border-2 border-foreground bg-white p-4 shadow-sm sm:p-5"
    >
      <label htmlFor="trash-body" className="sr-only">
        Trash talk message
      </label>
      <textarea
        id="trash-body"
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={2000}
        placeholder="Say something unhinged…"
        className="w-full resize-y rounded-lg border-2 border-border bg-[#f4f2ef]/50 px-3 py-2 text-sm focus-visible:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        {error ? (
          <p className="text-xs font-medium text-destructive" role="alert">
            {error}
          </p>
        ) : (
          <span className="text-xs text-muted-foreground">
            {body.length}/2000
          </span>
        )}
        <Button type="submit" size="sm" disabled={!body.trim() || pending}>
          {pending ? "Posting…" : "Post"}
        </Button>
      </div>
    </form>
  );
}
