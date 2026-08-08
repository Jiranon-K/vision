import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative flex gap-3 rounded-xl border-2 p-4 text-sm",
  {
    variants: {
      tone: {
        /* The one tone that carries no status meaning — for conditions that
           are neither the Creator's fault nor a result, like an unreachable
           server. Colouring those red reads as rejection. */
        neutral: "border-border bg-surface-muted text-text-secondary",
        info: "border-info bg-info-subtle text-info-strong",
        success: "border-success bg-success-subtle text-success-strong",
        warning: "border-warning bg-warning-subtle text-warning-strong",
        error: "border-error bg-error-subtle text-error-strong",
      },
    },
    defaultVariants: {
      tone: "info",
    },
  }
);

type AlertTone = "neutral" | "info" | "success" | "warning" | "error";

const toneIconPath: Record<AlertTone, string> = {
  neutral: "M12 16v-4m0-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  info: "M12 16v-4m0-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  success: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  warning:
    "M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z",
  error: "M15 9l-6 6m0-6l6 6m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
};

export interface AlertProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  tone?: AlertTone;
  title?: React.ReactNode;
  /** Renders a dismiss control. The parent owns the visibility state. */
  onDismiss?: () => void;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, tone = "info", title, onDismiss, children, ...props }, ref) => (
    <div
      ref={ref}
      role={tone === "error" ? "alert" : "status"}
      className={cn(alertVariants({ tone, className }))}
      {...props}
    >
      <svg
        className="mt-0.5 size-5 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={toneIconPath[tone]} />
      </svg>

      <div className="min-w-0 flex-1">
        {title ? <p className="font-bold">{title}</p> : null}
        {children ? (
          <div className={cn(title && "mt-1", "text-current/90")}>{children}</div>
        ) : null}
      </div>

      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="-m-1 shrink-0 self-start rounded-md p-1 transition-colors hover:bg-state-hover"
        >
          <svg
            className="size-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      ) : null}
    </div>
  )
);
Alert.displayName = "Alert";

export { Alert, alertVariants };
