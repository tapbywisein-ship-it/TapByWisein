import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl bg-card/80 dark:bg-zinc-900/80 border border-input text-sm text-foreground placeholder:text-muted-foreground outline-none focus:outline-none focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/20 dark:focus:border-blue-400/60 dark:focus:ring-blue-400/15 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
