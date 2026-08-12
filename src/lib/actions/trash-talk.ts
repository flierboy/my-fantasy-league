"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOwner } from "@/lib/auth/session";

export async function createTrashTalkPost(
  body: string
): Promise<{ ok: boolean; error?: string }> {
  const trimmed = body.trim();
  if (!trimmed) {
    return { ok: false, error: "Message cannot be empty." };
  }
  if (trimmed.length > 2000) {
    return { ok: false, error: "Message is too long (max 2000 characters)." };
  }

  const owner = await getCurrentOwner();
  if (!owner) {
    return {
      ok: false,
      error:
        "Your login is not linked to an owner record. Ask the commissioner to set owners.user_id.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("trash_talk_posts").insert({
    owner_id: owner.id,
    body: trimmed,
  });

  if (error) {
    console.error("[createTrashTalkPost]", error.message);
    return { ok: false, error: error.message };
  }

  revalidatePath("/trash-talk");
  return { ok: true };
}
