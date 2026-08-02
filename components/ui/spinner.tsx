import * as React from "react";
import { cn } from "@/lib/utils";

const spinnerSizes = {
  sm: "size-4 border-2",
  md: "size-5 border-2",
  lg: "size-7 border-[3px]",
} as const;

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: keyof typeof spinnerSizes;
  /** Announced to assistive tech. Pass null when a parent already labels the busy region. */
  label?: string | null;
}

const Spinner = React.forwardRef<HTMLSpanElement, SpinnerProps>(
  ({ className, size = "md", label = "Loading", ...props }, ref) => (
    <span
      ref={ref}
      role={label ? "status" : undefined}
      aria-hidden={label ? undefined : true}
      className={cn("inline-flex items-center", className)}
      {...props}
    >
      <span
        className={cn(
          "inline-block animate-spin rounded-full border-current border-r-transparent",
          spinnerSizes[size]
        )}
      />
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  )
);
Spinner.displayName = "Spinner";

export { Spinner };
