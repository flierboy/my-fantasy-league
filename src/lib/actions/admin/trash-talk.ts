"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "./types";
import { fail, ok } from "./types";
import { requireAdmin } from "./utils";

export async function deleteTrashTalkPost(
  formData: FormData
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return fail(gate.error);

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return fail("Post id is required");

  const supabase = await createClient();
  const { error } = await supabase
    .from("trash_talk_posts")
    .delete()
    .eq("id", id);

  if (error) return fail(error.message);

  revalidatePath("/trash-talk");
  revalidatePath("/admin/trash-talk");
  revalidatePath("/dashboard");
  return ok("Post deleted");
}
