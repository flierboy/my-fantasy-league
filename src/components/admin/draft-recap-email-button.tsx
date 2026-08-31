"use client";

import { useState, useTransition } from "react";
import { sendDraftRecapEmail } from "@/lib/actions/admin/draft-recap-email";
import type { ActionResult } from "@/lib/actions/admin/types";
import { Button } from "@/components/ui/button";
import { FormMessage } from "./form-message";

export function DraftRecapEmailButton() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);

  function onClick() {
    setResult(null);
    startTransition(async () => {
      const res = await sendDraftRecapEmail();
      setResult(res);
    });
  }

  return (
    <div className="ff-card space-y-3 p-5 sm:p-6">
      <div>
        <h2 className="ff-display text-xl">Draft recap email</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Send the UFD 2026 Draft Report Card to every owner with an email on
          file (skips opt-outs and blank addresses). Subject:{" "}
          <span className="font-semibold">UFD 2026 Draft Report Card</span>.
        </p>
      </div>
      <Button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="w-full sm:w-auto"
      >
        {pending ? "Sending…" : "Email draft recap"}
      </Button>
      <FormMessage result={result} />
    </div>
  );
}
