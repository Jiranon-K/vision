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
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

const LABEL: Record<AutosaveStatus, string> = {
  new: "New Post",
  writing: "Writing",
  saving: "Saving…",
  saved: "Autosaved",
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

  const dotColor =
    status === "saving" ? "bg-warning" : status === "saved" ? "bg-success" : "bg-text-muted";

  const dotMotion = prefersReducedMotion ? "" : pulsing ? "animate-dot-pulse" : "animate-dot-breathe";

  return (
    <div
      className={`flex min-w-[11rem] shrink-0 items-center gap-2 text-sm text-text-secondary ${className}`}
    >
      <span
        aria-hidden="true"
        className={`h-2 w-2 shrink-0 rounded-pill ${dotColor} ${dotMotion}`}
      />
      <span className="truncate tabular-nums">
        {LABEL[status]}
        {elapsed && status !== "saving" ? ` · ${elapsed}` : ""}
      </span>
    </div>
  );
}
