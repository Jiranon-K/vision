"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePrefersReducedMotion } from "@/shared/hooks/use-prefers-reduced-motion";
import { cn } from "@/shared/lib/utils";

// The Followers screens' motion: numbers count up once when they appear, a
// state change eases its container's height instead of jumping, and a check
// draws itself. Under reduced motion each shows its end state at once.

/** Counts up to `to` once; the final value at once under reduced motion. */
export function CountUp({ to, className, duration = 700 }: { to: number; className?: string; duration?: number }) {
  const reduced = usePrefersReducedMotion();
  // A hidden tab runs no animation frames, so it starts at the answer rather
  // than showing 0 until the Reader comes back to it.
  const [value, setValue] = useState(() =>
    typeof document !== "undefined" && document.hidden ? to : 0,
  );

  useEffect(() => {
    if (reduced) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(Math.round(to * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [to, duration, reduced]);

  return (
    <span className={cn("tabular-nums", className)}>{(reduced ? to : value).toLocaleString("en-US")}</span>
  );
}

/** Eases its height to fit whatever it holds, so a state change morphs rather than jumps. */
export function AutoHeight({ children, className }: { children: ReactNode; className?: string }) {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const [height, setHeight] = useState<number | "auto">("auto");

  useEffect(() => {
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setHeight(entry.contentRect.height));
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);

  return (
    <div
      className={cn("overflow-hidden motion-safe:transition-[height] motion-safe:duration-[var(--duration-slow)] motion-safe:ease-[var(--ease-out)]", className)}
      style={{ height }}
    >
      <div ref={setNode}>{children}</div>
    </div>
  );
}

export function CheckMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className={className} aria-hidden>
      <path
        d="M5 12.5l4.5 4.5L19 7.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        className="[stroke-dasharray:1] motion-safe:[stroke-dashoffset:1] motion-safe:animate-draw"
      />
    </svg>
  );
}

/** The stagger step between rows rising into a list. */
export const STAGGER_MS = 35;
