"use server";

import { getCurrentOwner } from "@/lib/auth/session";
import type { Owner } from "@/lib/types";

export async function requireAdmin(): Promise<
  { ok: true; owner: Owner } | { ok: false; error: string }
> {
  const owner = await getCurrentOwner();
  if (!owner) {
    return {
      ok: false,
      error:
        "Not signed in or not linked to an owner. Set owners.user_id for your auth user.",
    };
  }
  if (!owner.is_admin) {
    return {
      ok: false,
      error: "Admin access required. Your owner row must have is_admin = true.",
    };
  }
  return { ok: true, owner };
}
