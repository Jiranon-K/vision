import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium transition-all disabled:pointer-events-none disabled:opacity-[var(--state-disabled-opacity)] aria-busy:cursor-progress",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-hard hover:bg-primary-hover hover:text-text-on-brand hover:shadow-none hover:translate-x-1 hover:translate-y-1 active:scale-[0.98]",
        /* `accent` rather than `secondary`: the secondary surface is grey
           in dark mode, and this variant is the lime one in both themes. */
        secondary:
          "bg-accent text-accent-foreground border-2 border-border-strong shadow-hard hover:shadow-none hover:translate-x-1 hover:translate-y-1 active:scale-[0.98]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-error-strong active:scale-[0.98]",
        outline:
          "border-2 border-border-strong bg-transparent text-foreground hover:bg-surface-inverse hover:text-text-inverse active:scale-[0.98]",
        ghost: "text-foreground hover:bg-state-hover active:bg-state-active",
        link: "text-foreground underline-offset-4 hover:underline",
      },
      size: {
        sm: "px-5 py-2.5 text-base",
        default: "px-8 py-4 text-lg",
        lg: "px-10 py-5 text-xl",
        icon: "size-10 p-0",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      fullWidth: false,
    },
  }
);

const spinnerSizeForButton = {
  sm: "sm",
  default: "md",
  lg: "lg",
  icon: "sm",
} as const;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Swaps the label for a spinner and blocks interaction. */
  loading?: boolean;
  /** Replaces the label while loading. Omit to keep the label in place. */
  loadingText?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      loading = false,
      loadingText,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const resolvedSize = size ?? "default";

    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <Spinner
            size={spinnerSizeForButton[resolvedSize]}
            label={loadingText ? null : "Loading"}
          />
        ) : null}
        {loading && loadingText ? loadingText : children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
