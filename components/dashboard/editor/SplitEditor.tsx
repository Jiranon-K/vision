"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import MarkdownToolbar from "./MarkdownToolbar";
import MarkdownEditor from "./MarkdownEditor";
import MarkdownPreview from "./MarkdownPreview";
import type { SplitEditorProps } from "./types";

// A pane fades in from a small horizontal offset the moment it mounts —
// which, because the editor/preview panes are conditionally rendered by
// mode below, only happens when a pane is genuinely arriving (write <->
// preview). A pane that was already visible (e.g. the editor across a
// write <-> split switch) never remounts, so it never re-plays the fade;
// it just occupies its new width instantly, with no width/height
// transition applied to it at all — that's what keeps a mode switch from
// ever resizing a pane mid-transition.
function Pane({ children, className }: { children: ReactNode; className?: string }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [entered, setEntered] = useState(prefersReducedMotion);

  useEffect(() => {
    if (prefersReducedMotion) {
      // Goes through a timer (delay 0) rather than setting state directly
      // in the effect body, same as EditorTopBar's entrance — it's the CSS
      // transition duration that actually removes the stagger, not this.
      const timer = window.setTimeout(() => setEntered(true), 0);
      return () => window.clearTimeout(timer);
    }
    // `entered` already starts false for this branch (see the useState
    // initializer above) — committing that starting frame before flipping
    // to settled is what makes the transition play instead of collapsing
    // into a single paint.
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true));
    });
    return () => cancelAnimationFrame(raf);
  }, [prefersReducedMotion]);

  return (
    <div
      className={`min-w-0 transition-[opacity,transform] ${
        entered ? "translate-x-0 opacity-100" : "translate-x-2 opacity-0"
      } ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

export default function SplitEditor({ value, onChange, mode }: SplitEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div className="flex h-full flex-col">
      <MarkdownToolbar textareaRef={textareaRef} value={value} onChange={onChange} />

      <div className="flex flex-1 gap-4 min-h-0">
        {mode !== "preview" && (
          <Pane className="flex-1">
            <MarkdownEditor value={value} onChange={onChange} textareaRef={textareaRef} />
          </Pane>
        )}

        {mode !== "write" && (
          <Pane className="flex-1">
            <MarkdownPreview content={value} />
          </Pane>
        )}
      </div>
    </div>
  );
}
