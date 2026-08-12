import { cn } from "@/lib/utils";

export function Field({
  label,
  htmlFor,
  children,
  className,
  hint,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
  hint?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
      >
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

export const fieldInputClass =
  "flex h-10 w-full rounded-lg border-2 border-border bg-white px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-foreground disabled:cursor-not-allowed disabled:opacity-50";

export const fieldTextareaClass =
  "flex min-h-[88px] w-full rounded-lg border-2 border-border bg-white px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-foreground disabled:cursor-not-allowed disabled:opacity-50";
