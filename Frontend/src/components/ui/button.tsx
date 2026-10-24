import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary CTA — matches the Discover page gradient + specular top border & glow
        default:
          "bg-gradient-to-b from-[#1981FE] to-[#1673e6] text-white shadow-[0_2px_8px_rgba(25,129,254,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-[#1673e6] hover:brightness-105",
        // Primary on dark
        "primary-invert":
          "bg-white text-navy font-bold shadow-sm hover:bg-brand-blue-lighter",
        // Outline CTA — premium glass chip look with subtle specular border & hover
        outline:
          "premium-glass-chip text-foreground hover:text-foreground",
        // Ghost — for nav/icon buttons
        ghost:
          "text-foreground hover:bg-muted/60",
        destructive:
          "bg-destructive text-destructive-foreground hover:brightness-110 shadow-sm",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        link:
          "text-primary underline-offset-4 hover:underline rounded-none",
        glass:
          "premium-glass-chip text-foreground",
      },
      size: {
        default: "h-10 px-5 py-2 text-sm",
        sm:      "h-8 px-3.5 py-1.5 text-xs rounded-lg",
        lg:      "h-12 px-8 py-3 text-base rounded-xl",
        xl:      "h-14 px-10 py-4 text-base rounded-2xl",
        icon:    "h-9 w-9 p-0 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
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
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
