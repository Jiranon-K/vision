"use client";

import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import PublishAction from "./PublishAction";
import AutosaveStatusSlot from "./AutosaveStatusSlot";
import EditorMeterSlot from "./EditorMeterSlot";
import EditorModeSwitchSlot from "./EditorModeSwitchSlot";
import type { EditorMode } from "./types";

export interface EditorTopBarProps {
  /** Flips true once the writing surface has started its own entrance —
   *  the bar's fade waits on this rather than running independently, so
   *  the arrival order (writing surface, then chrome) always holds. */
  entering: boolean;
  onBack: () => void;
  backLabel?: string;
  saveLabel: string;
  saving: boolean;
  canSave: boolean;
  onSave: () => void;
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  splitAvailable: boolean;
}

// The chrome follows the writing surface in "about 120ms later" (ticket 01).
const ENTRANCE_DELAY_MS = 120;

// A grace window so a single keystroke — a stray key, a shortcut that slipped
// the filter below — does not flicker the bar. Long enough to be deliberate,
// short enough that the bar is gone by the second word.
const RECEDE_DELAY_MS = 400;

// Keys that move focus or edit selection state without putting text on the
// page — receding on these would hide the bar out from under someone
// tabbing toward it.
const NON_TYPING_KEYS = new Set([
  "Tab",
  "Escape",
  "Shift",
  "Control",
  "Alt",
  "Meta",
  "CapsLock",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Home",
  "End",
  "PageUp",
  "PageDown",
  "Insert",
]);

export default function EditorTopBar({
  entering,
  onBack,
  backLabel = "Back to Posts",
  saveLabel,
  saving,
  canSave,
  onSave,
  mode,
  onModeChange,
  splitAvailable,
}: EditorTopBarProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);

  // Entrance: opacity only, no translate, ~120ms after the writing surface
  // starts (or instantly, at final opacity, under reduced motion).
  useEffect(() => {
    if (!entering) return;
    // Reduced motion still goes through the timer (delay 0) rather than
    // setting state synchronously in the effect body — the CSS transition
    // duration is what actually removes the stagger (see className below).
    const delay = prefersReducedMotion ? 0 : ENTRANCE_DELAY_MS;
    const timer = window.setTimeout(() => {
      setVisible(true);
      setEntered(true);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [entering, prefersReducedMotion]);

  // Recede while typing, return on any pointer movement. Reuses the same
  // `visible` state (and the same CSS opacity transition) the entrance used,
  // so there is exactly one thing controlling this element's opacity.
  useEffect(() => {
    if (!entered) return;

    let hideTimer: number | undefined;

    // The bar recedes *while* the Creator types and stays gone until they
    // reach for it. Restarting the timer on every keystroke would invert
    // that — a Creator typing continuously would never lose the chrome, and
    // it would appear only once they stopped, which is when they least need
    // the screen to change.
    const handleKeydown = (e: KeyboardEvent) => {
      if (NON_TYPING_KEYS.has(e.key) || e.ctrlKey || e.metaKey || e.altKey) return;
      if (hideTimer !== undefined) return;
      hideTimer = window.setTimeout(() => setVisible(false), RECEDE_DELAY_MS);
    };

    const handlePointerMove = () => {
      window.clearTimeout(hideTimer);
      hideTimer = undefined;
      setVisible(true);
    };

    // A keyboard-only Creator tabs toward a bar they cannot see otherwise —
    // it is pointer-events-none while hidden, so focus has to bring it back.
    const handleFocusIn = () => {
      window.clearTimeout(hideTimer);
      hideTimer = undefined;
      setVisible(true);
    };

    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("focusin", handleFocusIn);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("focusin", handleFocusIn);
      window.clearTimeout(hideTimer);
    };
  }, [entered]);

  return (
    <div
      // `fixed` takes the bar out of flow entirely, so hiding/showing it
      // never moves the text below — the page reserves the same height with
      // padding instead of relying on this element's own box.
      className={`fixed inset-x-0 top-0 z-40 flex h-[60px] items-center justify-between gap-3 border-b border-border bg-surface px-4 transition-opacity md:h-16 md:px-8 ${
        prefersReducedMotion
          ? "duration-[0ms]"
          : "duration-[var(--duration-slow)] ease-[var(--ease-out)]"
      } ${visible ? "opacity-100" : "pointer-events-none opacity-0"}`}
    >
      <button
        type="button"
        onClick={onBack}
        aria-label={backLabel}
        className="flex shrink-0 items-center gap-2 text-text-secondary transition-colors hover:text-foreground"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 4L6 10L12 16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="hidden font-medium sm:inline">{backLabel}</span>
      </button>

      <div className="flex min-w-0 flex-1 items-center justify-center gap-3">
        <AutosaveStatusSlot />
        <EditorMeterSlot />
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <EditorModeSwitchSlot
          mode={mode}
          onModeChange={onModeChange}
          splitAvailable={splitAvailable}
        />
        <PublishAction
          label={saveLabel}
          pending={saving}
          disabled={!canSave}
          onClick={onSave}
        />
      </div>
    </div>
  );
}
