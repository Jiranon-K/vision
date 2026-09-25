import * as React from "react";
import { cn } from "@/lib/utils";
import { FieldMessage, hasFieldMessage } from "@/components/ui/field-message";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  /** Mixed state. Visual only — the underlying value stays unchecked. */
  indeterminate?: boolean;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, hint, error, indeterminate = false, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const messageId = `${inputId}-message`;
    const described = hasFieldMessage({ hint, error });
    const innerRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => innerRef.current as HTMLInputElement);

    // `indeterminate` has no HTML attribute — it only exists on the DOM node.
    React.useEffect(() => {
      if (innerRef.current) innerRef.current.indeterminate = indeterminate;
    }, [indeterminate]);

    return (
      <div className="w-full">
        <div className="flex items-start gap-3">
          <span className="relative flex shrink-0 items-center">
            <input
              ref={innerRef}
              id={inputId}
              type="checkbox"
              className={cn(
                "peer size-5 cursor-pointer appearance-none rounded-md border-2 bg-surface transition-all",
                "checked:bg-accent checked:border-border-strong indeterminate:bg-accent indeterminate:border-border-strong",
                "hover:border-border-strong",
                "disabled:cursor-not-allowed disabled:opacity-[var(--state-disabled-opacity)]",
                error ? "border-error" : "border-border-strong",
                className
              )}
              aria-invalid={error ? true : undefined}
              aria-describedby={described ? messageId : undefined}
              {...props}
            />
            <svg
              className="pointer-events-none absolute left-0 size-5 p-0.5 text-text-on-brand opacity-0 transition-opacity peer-checked:opacity-100 peer-indeterminate:opacity-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={3.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
            <svg
              className="pointer-events-none absolute left-0 size-5 p-0.5 text-text-on-brand opacity-0 transition-opacity peer-indeterminate:opacity-100"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={3.5}
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 12h12" />
            </svg>
          </span>

          {label ? (
            <label
              htmlFor={inputId}
              className={cn(
                "text-base leading-5 text-foreground",
                props.disabled
                  ? "cursor-not-allowed opacity-[var(--state-disabled-opacity)]"
                  : "cursor-pointer"
              )}
            >
              {label}
            </label>
          ) : null}
        </div>

        <FieldMessage
          id={messageId}
          hint={hint}
          error={error}
          className="pl-8"
        />
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
