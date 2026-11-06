import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // px-3 py-2: space between the text and the border (dropped in the
          // restyle, which left text touching the edge in every input).
          "flex h-10 w-full rounded-xl px-3 py-2 bg-card/80 dark:bg-zinc-900/80 border border-input text-sm text-foreground placeholder:text-muted-foreground outline-none focus:outline-none focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/20 dark:focus:border-blue-400/60 dark:focus:ring-blue-400/15 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50",
          className,
          // Last, so a page's own text size can't undo it: iOS Safari zooms in
          // on fields under 16px, so phones always get 16px.
          "max-sm:text-base",
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
