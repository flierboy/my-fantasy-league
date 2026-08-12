import { cn } from "@/lib/utils";

interface OwnerAvatarProps {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-10 w-10 text-sm",
  md: "h-14 w-14 text-lg",
  lg: "h-24 w-24 text-2xl sm:h-28 sm:w-28",
};

/** Avatar with initials fallback — swap `src` for uploaded photos later. */
export function OwnerAvatar({
  name,
  src,
  size = "lg",
  className,
}: OwnerAvatarProps) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Deterministic pastel-ish bg from name
  const hue =
    name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 360;

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={cn(
          "rounded-full border-[3px] border-foreground object-cover bg-white",
          sizeClasses[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full border-[3px] border-foreground font-bold text-foreground",
        sizeClasses[size],
        className
      )}
      style={{
        background: `linear-gradient(145deg, hsl(${hue} 45% 88%), hsl(${hue} 35% 78%))`,
      }}
      aria-label={name}
    >
      {initials}
    </div>
  );
}
