"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOwner } from "@/lib/auth/session";

export async function castPollVote(
  pollId: string,
  optionIndex: number
): Promise<{ ok: boolean; error?: string }> {
  const owner = await getCurrentOwner();
  if (!owner) {
    return {
      ok: false,
      error:
        "Your login is not linked to an owner record. Ask the commissioner to set owners.user_id.",
    };
  }

  const supabase = await createClient();

  // Upsert: one vote per owner per poll
  const { error } = await supabase.from("poll_votes").upsert(
    {
      poll_id: pollId,
      owner_id: owner.id,
      option_index: optionIndex,
    },
    { onConflict: "poll_id,owner_id" }
  );

  if (error) {
    console.error("[castPollVote]", error.message);
    return { ok: false, error: error.message };
  }

  revalidatePath("/polls");
  return { ok: true };
}
