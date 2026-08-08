"use client";

import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import type { EditorMode } from "./types";

export interface EditorModeSwitchSlotProps {
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  /** Whether the viewport has room for two panes without breaking the
   *  measure (see the breakpoint comment on the "split" option below). */
  splitAvailable: boolean;
  className?: string;
}

const OPTIONS: { id: EditorMode; label: string }[] = [
  { id: "write", label: "Write" },
  // Split is desktop-only: each pane needs its own readable measure, and
  // two panes of prose only fit that at lg (1024px) and up — the same
  // width Tailwind's own `lg:` breakpoint marks as "room for a second
  // column". Below it the option is hidden, not just disabled, so a
  // Creator resizing down never lands on a mode the layout can't honor.
  { id: "split", label: "Split" },
  { id: "preview", label: "Preview" },
];

export default function EditorModeSwitchSlot({
  mode,
  onModeChange,
  splitAvailable,
  className = "",
}: EditorModeSwitchSlotProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const options = splitAvailable ? OPTIONS : OPTIONS.filter((o) => o.id !== "split");
  const activeIndex = options.findIndex((o) => o.id === mode);

  return (
    <div
      role="radiogroup"
      aria-label="Editor view"
      className={`relative inline-flex shrink-0 items-center rounded-pill border border-border bg-surface-muted p-1 text-sm font-medium ${className}`}
    >
      {/* The thumb — position driven purely by index, so hiding/showing the
          Split option never resizes it, only moves where it lands. */}
      <div
        aria-hidden="true"
        className={`absolute inset-y-1 rounded-pill bg-surface shadow-hard-sm transition-transform ${
          prefersReducedMotion ? "duration-[0ms]" : ""
        }`}
        style={{
          width: `calc((100% - 0.5rem) / ${options.length})`,
          transform: `translateX(calc(${activeIndex} * 100%))`,
        }}
      />
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={mode === option.id}
          onClick={() => onModeChange(option.id)}
          className={`relative z-10 rounded-pill px-3 py-1.5 transition-colors ${
            mode === option.id ? "text-foreground" : "text-text-secondary hover:text-foreground"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
