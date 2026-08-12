import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.99]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-neutral-800",
        outline:
          "border-2 border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-muted",
        ghost: "hover:bg-muted text-foreground font-semibold",
        link: "text-foreground underline-offset-4 hover:underline font-semibold",
      },
      size: {
        default: "h-11 rounded-lg px-6 text-sm uppercase tracking-wide",
        sm: "h-9 rounded-lg px-3 text-xs uppercase tracking-wide",
        lg: "h-12 rounded-lg px-8 text-base uppercase tracking-wide",
        icon: "h-10 w-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
