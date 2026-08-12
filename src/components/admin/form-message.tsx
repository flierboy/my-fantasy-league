"use client";

import type { ActionResult } from "@/lib/actions/admin/types";
import { cn } from "@/lib/utils";

export function FormMessage({
  result,
  className,
}: {
  result: ActionResult | null;
  className?: string;
}) {
  if (!result) return null;
  if (result.ok && !result.message) return null;

  return (
    <div
      role="status"
      className={cn(
        "rounded-lg border-2 px-3 py-2 text-sm font-medium",
        result.ok
          ? "border-emerald-700/40 bg-emerald-50 text-emerald-900"
          : "border-destructive/40 bg-red-50 text-destructive",
        className
      )}
    >
      {result.ok ? result.message : result.error}
    </div>
  );
}
