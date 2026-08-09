"use client";

import { useLayoutEffect, useRef, useState } from "react";
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

  // The labels are different lengths, so an equal-share thumb sits under the
  // wrong words — it has to be measured from the button it belongs to.
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [thumb, setThumb] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const el = buttonRefs.current[activeIndex];
      if (el) setThumb({ left: el.offsetLeft, width: el.offsetWidth });
    };
    measure();
    // Fonts land after first paint and change every label's width with them.
    document.fonts?.ready.then(measure).catch(() => {});
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [activeIndex, options.length]);

  return (
    <div
      role="radiogroup"
      aria-label="Editor view"
      className={`relative inline-flex shrink-0 items-center gap-1 rounded-xl bg-surface-muted p-[3px] text-[13px] font-bold ${className}`}
    >
      {thumb && (
        // The design draws the active option as a raised --surface tile with
        // the 2px outline and --elevation-hard-sm. Drawing it once, as a
        // thumb that slides, is what lets the switch move rather than blink.
        <div
          aria-hidden="true"
          className={`absolute inset-y-[3px] rounded-[9px] border-2 border-border-strong bg-surface shadow-hard-sm transition-[transform,width] ${
            prefersReducedMotion ? "duration-[0ms]" : "duration-[var(--duration-base)] ease-[var(--ease-standard)]"
          }`}
          style={{ width: thumb.width, transform: `translateX(${thumb.left}px)`, left: 0 }}
        />
      )}
      {options.map((option) => (
        <button
          key={option.id}
          ref={(el) => {
            buttonRefs.current[options.indexOf(option)] = el;
          }}
          type="button"
          role="radio"
          aria-checked={mode === option.id}
          onClick={() => onModeChange(option.id)}
          className={`relative z-10 rounded-[9px] px-3.5 py-1.5 transition-colors ${
            mode === option.id ? "text-foreground" : "text-text-muted hover:text-foreground"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
