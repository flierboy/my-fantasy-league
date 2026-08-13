import { cn } from "@/lib/utils";

interface OwnerAvatarProps {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "h-10 w-10 text-sm border-[2.5px]",
  md: "h-14 w-14 text-lg border-[3px]",
  lg: "h-24 w-24 text-2xl border-[3px] sm:h-28 sm:w-28",
  xl: "h-28 w-28 text-3xl border-[3px] sm:h-32 sm:w-32",
};

/**
 * Circular avatar — photo when available, illustrated initials placeholder otherwise.
 * Heavy black border matches Fake Football player cards.
 */
export function OwnerAvatar({
  name,
  src,
  size = "lg",
  className,
}: OwnerAvatarProps) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const hue =
    name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 360;

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={cn(
          "rounded-full border-foreground object-cover bg-white shadow-[2px_2px_0_0_#141414]",
          sizeClasses[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-full border-foreground font-bold text-foreground shadow-[2px_2px_0_0_#141414]",
        sizeClasses[size],
        className
      )}
      style={{
        background: `linear-gradient(145deg, hsl(${hue} 55% 88%) 0%, hsl(${(hue + 40) % 360} 40% 72%) 55%, hsl(${hue} 30% 55%) 100%)`,
      }}
      aria-label={name}
    >
      {/* soft “illustrated” ring */}
      <span
        className="pointer-events-none absolute inset-[10%] rounded-full opacity-30"
        style={{
          background: `radial-gradient(circle at 30% 25%, #fff 0%, transparent 55%)`,
        }}
        aria-hidden
      />
      <span className="ff-display relative z-[1] tracking-wide drop-shadow-sm">
        {initials}
      </span>
    </div>
  );
}
