"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { EyeIcon, EyeOffIcon } from "@/components/ui/Icons";

// Returns the input `type` plus a ready-made toggle button, so it drops into
// both the raw <input> auth forms and the styled <Input> primitive without
// either having to agree on a shared wrapper. Caller supplies `relative` on the
// wrapper and enough right padding that text doesn't run under the button.
export function usePasswordToggle(buttonClassName?: string) {
  const [visible, setVisible] = useState(false);

  const toggle = (
    <button
      type="button"
      onClick={() => setVisible((v) => !v)}
      aria-label={visible ? "Hide password" : "Show password"}
      className={cn(
        // top/bottom rather than inset-y so twMerge can actually override them.
        "absolute right-4 top-0 bottom-0 flex items-center text-brand-dark/40 hover:text-brand-dark transition-colors cursor-pointer",
        buttonClassName
      )}
    >
      {visible ? <EyeOffIcon /> : <EyeIcon />}
    </button>
  );

  return { type: visible ? "text" : "password", toggle };
}
