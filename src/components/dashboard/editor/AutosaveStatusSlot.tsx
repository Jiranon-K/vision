"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export type AutosaveStatus = "new" | "writing" | "saving" | "saved";

export interface AutosaveStatusSlotProps {
  status: AutosaveStatus;
  /** ms epoch of the last commit — the local autosave's, or (in edit mode)
   *  the Post's own last server save, whichever PostEditorForm judges more
   *  relevant. Null only for `status === "new"`. */
  lastSavedAt: number | null;
  className?: string;
}

// Matches `dot-pulse`'s duration in app/globals.css — kept as one number so
// the JS timer that clears the pulse class can't drift from the CSS.
const PULSE_MS = 500;

function formatElapsed(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

// The design writes the whole chip as one phrase — "Saved 8s ago" — rather
// than a label and a separate clock, so the elapsed time is appended to
// "Saved" and to nothing else.
const LABEL: Record<AutosaveStatus, string> = {
  new: "New Post",
  writing: "Saved",
  saving: "Saving…",
  saved: "Saved",
};

// Fills the slot ticket 01 left empty. Reports the four states the Creator's
// autosave can be in, honestly — it never says "Autosaved" before a commit
// has actually landed (see PostEditorForm for how `status`/`lastSavedAt` are
// derived from useAutosaveDraft).
export default function AutosaveStatusSlot({
  status,
  lastSavedAt,
  className = "",
}: AutosaveStatusSlotProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  // Live "Xs ago" clock, ticking once a second — isolated to this slot so
  // the rest of the editor never re-renders on a timer.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (lastSavedAt === null) return;
    // Re-times from zero the instant a new commit lands, rather than
    // waiting up to 1s for the next tick to catch up. Deferred through a
    // timer (delay 0) rather than calling setState synchronously in the
    // effect body, which the lint rules (rightly) flag as a cascading
    // render — same idiom EditorTopBar's entrance effect uses.
    const resetTimer = window.setTimeout(() => setNow(Date.now()), 0);
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearTimeout(resetTimer);
      window.clearInterval(id);
    };
  }, [lastSavedAt]);

  // One-shot pulse on the instant a commit lands — i.e. lastSavedAt actually
  // changes, not merely because the slot mounted with one already set (a
  // resumed draft, or an edit-mode Post's prior save).
  const isFirstRender = useRef(true);
  const prevSavedAt = useRef(lastSavedAt);
  const [pulsing, setPulsing] = useState(false);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevSavedAt.current = lastSavedAt;
      return;
    }
    if (lastSavedAt !== null && lastSavedAt !== prevSavedAt.current) {
      prevSavedAt.current = lastSavedAt;
      if (!prefersReducedMotion) {
        const start = window.setTimeout(() => setPulsing(true), 0);
        const stop = window.setTimeout(() => setPulsing(false), PULSE_MS);
        return () => {
          window.clearTimeout(start);
          window.clearTimeout(stop);
        };
      }
    }
  }, [lastSavedAt, prefersReducedMotion]);

  const elapsed =
    lastSavedAt !== null && status !== "new" ? formatElapsed(now - lastSavedAt) : null;

  // A Post with nothing committed yet gets a faint, still dot — the breathing
  // green one is the claim "your work is safe", and it is not true yet.
  const dotColor =
    status === "saving" ? "bg-warning" : status === "new" ? "bg-text-faint" : "bg-success";

  const dotMotion =
    prefersReducedMotion || status === "new" || status === "saving"
      ? ""
      : pulsing
        ? "animate-dot-pulse"
        : "animate-dot-breathe";

  return (
    // A pill on --surface-muted, not a bare row: the dot and its phrase are
    // one object in the design, and the chip is what gives way first when the
    // bar runs out of width.
    <div
      className={`flex shrink-0 items-center gap-2 rounded-pill bg-surface-muted px-3 py-1.5 ${className}`}
    >
      <span
        aria-hidden="true"
        className={`size-2 shrink-0 rounded-pill ${dotColor} ${dotMotion}`}
      />
      <span className="truncate font-mono text-xs tabular-nums text-text-secondary">
        {LABEL[status]}
        {/* On a 390px bar the exact age is not worth its width — the dot
            already carries "your work is safe". */}
        {elapsed && status !== "saving" ? (
          <span className="hidden sm:inline">{` ${elapsed}`}</span>
        ) : null}
      </span>
    </div>
  );
}
