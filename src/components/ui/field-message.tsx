import * as React from "react";
import { cn } from "@/lib/utils";

export interface FieldMessageProps {
  id: string;
  hint?: React.ReactNode;
  error?: string;
  success?: string;
  className?: string;
}

/**
 * The message slot under a form control. Precedence is error, then success,
 * then hint — a field never shows two at once, and the id is what the control
 * points `aria-describedby` at.
 */
function FieldMessage({
  id,
  hint,
  error,
  success,
  className,
}: FieldMessageProps) {
  const message = error ?? success ?? hint;
  if (!message) return null;

  return (
    <p
      id={id}
      role={error ? "alert" : undefined}
      className={cn(
        "mt-1.5 text-sm",
        error ? "text-error-strong" : success ? "text-success-strong" : "text-text-muted",
        className
      )}
    >
      {message}
    </p>
  );
}

/** True when a control has any message to describe it. */
function hasFieldMessage({
  hint,
  error,
  success,
}: Pick<FieldMessageProps, "hint" | "error" | "success">) {
  return Boolean(error ?? success ?? hint);
}

export { FieldMessage, hasFieldMessage };
