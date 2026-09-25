import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill font-bold",
  {
    variants: {
      tone: {
        neutral: "",
        brand: "",
        success: "",
        warning: "",
        error: "",
        info: "",
      },
      appearance: {
        subtle: "",
        solid: "",
        outline: "border-2 bg-transparent",
      },
      size: {
        sm: "px-2.5 py-0.5 text-xs",
        md: "px-3 py-1 text-sm",
      },
    },
    compoundVariants: [
      { tone: "neutral", appearance: "subtle", class: "bg-surface-muted text-text-secondary" },
      { tone: "neutral", appearance: "solid", class: "bg-surface-inverse text-background" },
      { tone: "neutral", appearance: "outline", class: "border-border-strong text-foreground" },

      { tone: "brand", appearance: "subtle", class: "bg-lime-200 text-lime-900" },
      { tone: "brand", appearance: "solid", class: "bg-brand-lime text-text-on-brand" },
      { tone: "brand", appearance: "outline", class: "border-brand-border text-brand-text" },

      { tone: "success", appearance: "subtle", class: "bg-success-subtle text-success-strong" },
      { tone: "success", appearance: "solid", class: "bg-success text-success-on" },
      { tone: "success", appearance: "outline", class: "border-success text-success-strong" },

      { tone: "warning", appearance: "subtle", class: "bg-warning-subtle text-warning-strong" },
      { tone: "warning", appearance: "solid", class: "bg-warning text-warning-on" },
      { tone: "warning", appearance: "outline", class: "border-warning text-warning-strong" },

      { tone: "error", appearance: "subtle", class: "bg-error-subtle text-error-strong" },
      { tone: "error", appearance: "solid", class: "bg-error text-error-on" },
      { tone: "error", appearance: "outline", class: "border-error text-error-strong" },

      { tone: "info", appearance: "subtle", class: "bg-info-subtle text-info-strong" },
      { tone: "info", appearance: "solid", class: "bg-info text-info-on" },
      { tone: "info", appearance: "outline", class: "border-info text-info-strong" },
    ],
    defaultVariants: {
      tone: "neutral",
      appearance: "subtle",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, tone, appearance, size, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ tone, appearance, size, className }))}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
