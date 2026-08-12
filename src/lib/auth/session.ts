import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { mapOwner } from "@/lib/data/mappers";
import type { Owner } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

export async function getAuthUser(): Promise<User | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

/** Owner row linked to the signed-in auth user (via owners.user_id). */
export async function getCurrentOwner(): Promise<Owner | null> {
  const user = await getAuthUser();
  if (!user) return null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("owners")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !data) return null;
    return mapOwner(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function getSessionContext(): Promise<{
  user: User | null;
  owner: Owner | null;
  isAdmin: boolean;
}> {
  const user = await getAuthUser();
  if (!user) {
    return { user: null, owner: null, isAdmin: false };
  }
  const owner = await getCurrentOwner();
  return {
    user,
    owner,
    isAdmin: Boolean(owner?.is_admin),
  };
}
