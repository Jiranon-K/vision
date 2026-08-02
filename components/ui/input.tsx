import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { FieldMessage, hasFieldMessage } from "@/components/ui/field-message";

const inputVariants = cva(
  "flex w-full rounded-xl border-2 bg-surface text-foreground transition-all placeholder:text-text-faint disabled:cursor-not-allowed disabled:opacity-[var(--state-disabled-opacity)] read-only:bg-surface-muted read-only:text-text-secondary",
  {
    variants: {
      inputSize: {
        sm: "h-10 px-3 py-2 text-sm",
        md: "h-12 px-4 py-3 text-base",
        lg: "h-14 px-5 py-4 text-lg",
      },
      status: {
        default: "border-border hover:border-border-strong",
        error: "border-error",
        success: "border-success-strong",
      },
    },
    defaultVariants: {
      inputSize: "md",
      status: "default",
    },
  }
);

const iconPadding = {
  sm: { leading: "pl-9", trailing: "pr-9" },
  md: { leading: "pl-11", trailing: "pr-11" },
  lg: { leading: "pl-12", trailing: "pr-12" },
} as const;

type InputSize = NonNullable<VariantProps<typeof inputVariants>["inputSize"]>;

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  inputSize?: InputSize;
  label?: React.ReactNode;
  /** Guidance shown under the field. Hidden while an error or success message is showing. */
  hint?: React.ReactNode;
  error?: string;
  success?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      inputSize = "md",
      label,
      hint,
      error,
      success,
      leadingIcon,
      trailingIcon,
      id,
      required,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const status = error ? "error" : success ? "success" : "default";
    const messageId = `${inputId}-message`;
    const described = hasFieldMessage({ hint, error, success });

    return (
      <div className="w-full">
        {label ? (
          <Label htmlFor={inputId} required={required} className="mb-1.5">
            {label}
          </Label>
        ) : null}

        <div className="relative">
          {leadingIcon ? (
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-muted">
              {leadingIcon}
            </span>
          ) : null}

          <input
            type={type}
            id={inputId}
            required={required}
            className={cn(
              inputVariants({ inputSize, status }),
              leadingIcon && iconPadding[inputSize].leading,
              trailingIcon && iconPadding[inputSize].trailing,
              className
            )}
            ref={ref}
            aria-invalid={error ? true : undefined}
            aria-describedby={described ? messageId : undefined}
            {...props}
          />

          {trailingIcon ? (
            <span className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-text-muted">
              {trailingIcon}
            </span>
          ) : null}
        </div>

        <FieldMessage
          id={messageId}
          hint={hint}
          error={error}
          success={success}
        />
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input, inputVariants };
