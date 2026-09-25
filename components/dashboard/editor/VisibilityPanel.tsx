"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDownIcon, EyeOffIcon, LockIcon } from "@/components/ui/Icons";

interface VisibilityPanelProps {
  withheld: boolean;
  readOnly: boolean;
}

const WITHHELD_HISTORY = [
  { dot: "bg-accent", title: "Published", detail: "By its Creator", tone: "text-foreground", Icon: null },
  {
    dot: "bg-warning",
    title: "Withheld by Vision",
    detail: "Not shown on the blog, in search or at its link",
    tone: "text-warning-strong",
    Icon: EyeOffIcon,
  },
];

export default function VisibilityPanel({ withheld, readOnly }: VisibilityPanelProps) {
  const [open, setOpen] = useState(true);
  if (!withheld && !readOnly) return null;

  return (
    <aside
      aria-label="Visibility"
      className={cn(
        "z-20 mx-4 mt-3 shrink-0 overflow-hidden rounded-xl border border-border bg-surface shadow-panel",
        "motion-safe:animate-panel-in",
        "lg:absolute lg:right-4 lg:top-18 lg:mx-0 lg:mt-0 lg:w-72",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between border-b border-border px-4 py-2.5 text-left"
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Visibility
        </span>
        <ChevronDownIcon
          className={cn("h-4 w-4 text-text-secondary transition-transform", !open && "-rotate-90")}
        />
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows,visibility] duration-(--duration-slow) ease-(--ease-out)",
          open ? "visible grid-rows-[1fr]" : "invisible grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-3 px-4 py-3 text-xs">
            {withheld && (
              <ol className="space-y-3 border-l border-border pl-4">
                {WITHHELD_HISTORY.map((step) => (
                  <li key={step.title} className="relative">
                    <span
                      className={cn(
                        "absolute -left-4 top-0.5 h-2.5 w-2.5 -translate-x-1/2 rounded-full ring-2 ring-surface",
                        step.dot,
                      )}
                    />
                    <p className={cn("flex items-center gap-1 font-medium", step.tone)}>
                      {step.Icon && <step.Icon className="h-3.5 w-3.5" />}
                      {step.title}
                    </p>
                    <p className="text-text-secondary">{step.detail}</p>
                  </li>
                ))}
              </ol>
            )}

            {withheld && (
              <p className="text-text-secondary">
                Only Vision can lift this. Publishing again won&apos;t make it visible.
              </p>
            )}

            {readOnly && (
              <div className="flex gap-2.5 rounded-lg bg-surface-muted p-3 text-text-secondary">
                <LockIcon className="h-4 w-4 shrink-0" />
                <p>
                  <span className="font-medium text-foreground">Read-only.</span> Only this
                  Post&apos;s Creator can edit, publish or delete it.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
