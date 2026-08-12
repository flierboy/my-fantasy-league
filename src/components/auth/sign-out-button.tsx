"use client";

export function SignOutButton({ className }: { className?: string }) {
  return (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        className={
          className ??
          "inline-flex h-9 items-center rounded-lg border-2 border-foreground bg-transparent px-3 text-xs font-bold uppercase tracking-wide text-foreground hover:bg-muted"
        }
      >
        Sign out
      </button>
    </form>
  );
}
