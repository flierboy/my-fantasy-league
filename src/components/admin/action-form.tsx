"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/lib/actions/admin/types";
import { FormMessage } from "./form-message";
import { cn } from "@/lib/utils";

type AdminAction = (formData: FormData) => Promise<ActionResult>;

/**
 * Thin client wrapper around a server action with success/error messaging.
 */
export function ActionForm({
  action,
  children,
  className,
  onSuccess,
}: {
  action: AdminAction;
  children: React.ReactNode;
  className?: string;
  onSuccess?: () => void;
}) {
  const [state, formAction] = useActionState(
    async (_prev: ActionResult | null, formData: FormData) => {
      const result = await action(formData);
      if (result.ok) onSuccess?.();
      return result;
    },
    null as ActionResult | null
  );

  return (
    <form action={formAction} className={cn("space-y-3", className)}>
      {children}
      <FormMessage result={state} />
    </form>
  );
}
