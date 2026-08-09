"use client";

import { useEffect, useRef, useState } from "react";
import { animate, set } from "animejs";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import DetailsAction from "./DetailsAction";
import PublishAction from "./PublishAction";
import PostStatusSlot from "./PostStatusSlot";
import AutosaveStatusSlot, { type AutosaveStatus } from "./AutosaveStatusSlot";
import EditorMeterSlot from "./EditorMeterSlot";
import EditorModeSwitchSlot from "./EditorModeSwitchSlot";
import SaveNowAction from "./SaveNowAction";
import type { EditorMode } from "./types";

// Mirrors the hold PostEditorForm gives a Draft -> Published transition
// before it navigates away — the value (not the token) has to be duplicated
// because animejs can't read app/globals.css's custom properties. Kept
// deliberately the longest-running motion in the bar: ticket 04 calls this
// out as the one action here with consequences outside the screen.
const PUBLISH_WASH_MS = 900;

export interface EditorTopBarProps {
  /** Flips true once the writing surface has started its own entrance —
   *  the bar's fade waits on this rather than running independently, so
   *  the arrival order (writing surface, then chrome) always holds. */
  entering: boolean;
  onBack: () => void;
  backLabel?: string;
  status: "Draft" | "Published";
  /** True for one brief window right after a Draft -> Published save lands
   *  — drives the crossfade's accent wash (or, under reduced motion, the
   *  static accent rule) across the bar. PostEditorForm owns the timer. */
  statusAccent: boolean;
  saving: boolean;
  /** Whether Save and Publish appear at all. A Creator who can't save gets
   *  neither control rather than a disabled one — a control that can never
   *  be used shouldn't occupy the eye (ticket 08). */
  showSave: boolean;
  /** Persists the Post exactly as it stands, status untouched — distinct
   *  from `onOpenPublish` so a Draft can be saved to the server without
   *  ever reaching the Publish sheet (ticket 04). Surfaced as "Save now",
   *  which appears only while `dirty`. */
  onSave: () => void;
  onOpenPublish: () => void;
  /** Opens the details drawer (ticket 05) — cover image and Excerpt, reachable
   *  in one gesture and never required in order to Publish. */
  onOpenDetails: () => void;
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  splitAvailable: boolean;
  /** Autosave chip state — see AutosaveStatusSlot. */
  autosaveStatus: AutosaveStatus;
  autosaveLastSavedAt: number | null;
  /** Word count / reading time meter reads straight off the buffer. */
  content: string;
  /** Whether the Post on screen differs from the one on the server — the
   *  only thing "Save now" can act on, so it is also what decides whether
   *  the control is on the bar at all. */
  dirty: boolean;
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
  backLabel = "Posts",
  status,
  statusAccent,
  saving,
  showSave,
  onSave,
  onOpenPublish,
  onOpenDetails,
  mode,
  onModeChange,
  splitAvailable,
  autosaveStatus,
  autosaveLastSavedAt,
  content,
  dirty,
}: EditorTopBarProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);
  const washRef = useRef<HTMLDivElement>(null);

  // The accent wash itself — a translucent sweep, not the static reduced-
  // motion rule below. Runs once per `statusAccent` pulse from false -> true.
  useEffect(() => {
    if (!statusAccent || prefersReducedMotion) return;
    const el = washRef.current;
    if (!el) return;
    set(el, { opacity: 0 });
    animate(el, { opacity: [0, 0.35, 0], duration: PUBLISH_WASH_MS, ease: "linear" });
  }, [statusAccent, prefersReducedMotion]);

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
    <header
      // A flex row in the editor column, not a fixed overlay: the design has
      // the bar sitting on the canvas and the canvas scrolling beneath it.
      // It keeps its height while receding — only opacity animates — so a
      // Creator typing never sees the text below it move.
      className={`relative z-30 flex h-16 shrink-0 items-center gap-2 border-b border-border-subtle bg-surface px-3 transition-opacity sm:gap-3 sm:px-[18px] ${
        prefersReducedMotion
          ? "duration-[0ms]"
          : "duration-[var(--duration-slow)] ease-[var(--ease-out)]"
      } ${visible ? "opacity-100" : "pointer-events-none opacity-0"}`}
    >
      {statusAccent &&
        (prefersReducedMotion ? (
          // The reduced-motion state: no sweep, just a held rule at the
          // bar's lower edge for the same window the full wash would run.
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1 bg-accent" />
        ) : (
          <div ref={washRef} aria-hidden="true" className="absolute inset-0 bg-accent opacity-0" />
        ))}

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
        <span className="hidden text-sm font-semibold sm:inline">{backLabel}</span>
      </button>

      {/* State on the left, next to where the Creator came from; actions on
          the right. The spacer between them is what keeps the two groups
          apart at every width rather than a justify rule that would drift
          as items withdraw. Both state items hide at compact widths, where
          the bottom bar carries them instead. */}
      <div className="hidden items-center gap-2 md:flex">
        <AutosaveStatusSlot status={autosaveStatus} lastSavedAt={autosaveLastSavedAt} />
        <PostStatusSlot status={status} />
      </div>

      <div className="min-w-0 flex-1" />

      <EditorMeterSlot content={content} />

      {/* Visibility lives on wrappers, never as a `hidden` passed into a
          component that already sets its own `display` — two display
          utilities at the same specificity are decided by stylesheet order,
          not by which one the caller wrote last. */}
      <div className="hidden sm:block">
        <EditorModeSwitchSlot
          mode={mode}
          onModeChange={onModeChange}
          splitAvailable={splitAvailable}
        />
      </div>

      {showSave && (
        <div className="hidden md:block">
          <SaveNowAction visible={dirty} saving={saving} onClick={onSave} />
        </div>
      )}
      <DetailsAction onClick={onOpenDetails} />
      {showSave && <PublishAction onClick={onOpenPublish} />}
    </header>
  );
}
