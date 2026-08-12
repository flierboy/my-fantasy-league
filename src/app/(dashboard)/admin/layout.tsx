import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth/session";
import { AdminNav } from "@/components/admin/admin-nav";

/**
 * Admin-only shell. Middleware ensures login; this layout requires is_admin.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, owner, isAdmin } = await getSessionContext();

  if (!user) {
    redirect("/login?next=/admin");
  }

  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <header>
          <p className="ff-ribbon">Restricted</p>
          <h1 className="ff-display mt-2 text-3xl tracking-tight">Admin</h1>
        </header>
        <div className="rounded-xl border-2 border-amber-600/40 bg-amber-50 p-5 text-sm text-amber-950">
          <p className="font-bold">Commissioner access only.</p>
          <p className="mt-2">
            Your account must be linked to an owner with{" "}
            <code className="font-mono text-xs">is_admin = true</code>.
          </p>
          {owner ? (
            <p className="mt-2">
              Signed in as <strong>{owner.display_name}</strong> (not admin).
            </p>
          ) : (
            <p className="mt-2">
              Owner not linked. Set{" "}
              <code className="font-mono text-xs">owners.user_id</code> in
              Supabase, then set <code className="font-mono text-xs">is_admin</code>.
            </p>
          )}
          {user && (
            <p className="mt-3 break-all font-mono text-xs">
              Your auth user id: {user.id}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminNav />
      {children}
    </div>
  );
}
