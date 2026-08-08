"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete?: string;
  "data-testid"?: string;
  /** Slot under the field — the strength meter goes here. */
  children?: React.ReactNode;
}

/**
 * A password input whose visibility toggle is a text button on the label row
 * rather than an icon inside the field, so nothing overlaps the value and the
 * control keeps a real label.
 */
export function PasswordField({
  id,
  label,
  value,
  onChange,
  error,
  autoComplete,
  children,
  "data-testid": testId,
}: PasswordFieldProps) {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <Label htmlFor={id}>{label}</Label>
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-controls={id}
          className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.06em] text-text-muted transition-colors hover:text-foreground"
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>

      <Input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="••••••••"
        autoComplete={autoComplete}
        error={error}
        data-testid={testId}
        required
      />

      {children}
    </div>
  );
}
