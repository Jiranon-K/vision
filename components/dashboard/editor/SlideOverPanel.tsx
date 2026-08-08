"use client";

import { useEffect, useId, useRef } from "react";
import { animate, set, cubicBezier } from "animejs";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { Button } from "@/components/ui/button";

export interface SlideOverPanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel?: string;
  children: React.ReactNode;
  /** Rendered below `children`, outside the scrolling flow's top group —
   *  callers that need a sticky action row (PublishSheet's Cancel/Confirm)
   *  pass `mt-auto` classes on their own wrapper. */
  footer?: React.ReactNode;
}

// Mirrors --duration-slow / --ease-out from app/globals.css — animejs
// animates DOM properties directly and can't read CSS custom properties, so
// the token's *value* is duplicated here rather than its name.
const ENTRANCE_DURATION = 300;
const ENTRANCE_EASE = cubicBezier(0.16, 1, 0.3, 1);

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Shared shell behind both slide-overs in the editor (PublishSheet, ticket 04;
// the details drawer, ticket 05): backdrop scrim, right-edge panel, focus
// trap, Escape-to-close, focus restoration on close, and the
// slide-in-over-a-scrim / reduced-motion-fade entrance. The two screens only
// ever differed in what fills the panel, so that's the only thing left to
// each caller.
export default function SlideOverPanel({
  open,
  onClose,
  title,
  closeLabel = "Close",
  children,
  footer,
}: SlideOverPanelProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const panel = panelRef.current;
    if (panel) {
      if (prefersReducedMotion) {
        set(panel, { opacity: 0, translateX: 0 });
        animate(panel, { opacity: [0, 1], duration: ENTRANCE_DURATION, ease: ENTRANCE_EASE });
      } else {
        set(panel, { translateX: "100%" });
        animate(panel, { translateX: ["100%", "0%"], duration: ENTRANCE_DURATION, ease: ENTRANCE_EASE });
      }
    }

    closeRef.current?.focus();

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panel) return;

      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeydown);

    return () => {
      document.removeEventListener("keydown", handleKeydown);
      // Sends focus back to whatever opened the panel — usually the control
      // in the top bar — rather than stranding it at the document root.
      previouslyFocused.current?.focus();
    };
  }, [open, onClose, prefersReducedMotion]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-surface-inverse/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex h-full w-full max-w-md flex-col gap-6 overflow-y-auto border-l-2 border-border-strong bg-surface p-6 opacity-0 shadow-panel"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-xl font-black text-foreground">
            {title}
          </h2>
          <Button ref={closeRef} type="button" variant="ghost" size="icon" onClick={onClose} aria-label={closeLabel}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </Button>
        </div>

        {children}

        {footer}
      </div>
    </div>
  );
}
