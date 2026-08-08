"use client";

import { useLayoutEffect, useRef } from "react";

export interface PostTitleFieldProps {
  value: string;
  onChange: (value: string) => void;
}

// The title is the first line of the Post, not a setting about it — sized
// and weighted as display type, and never allowed to clip or scroll.
export default function PostTitleField({ value, onChange }: PostTitleFieldProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Grows (and shrinks) with content. Reset to "auto" before reading
  // scrollHeight so a deleted line shrinks the box back down too, not just
  // growth. Both happen in the same layout pass before paint, so there is
  // one resize per keystroke rather than a visible flash-then-grow — and
  // because nothing here touches selectionStart/selectionEnd, the caret
  // never moves; the browser keeps it exactly where the Creator left it.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        // A wrapped title is still one logical line — Enter would otherwise
        // insert a hard break the rest of the product doesn't expect.
        if (e.key === "Enter") e.preventDefault();
      }}
      placeholder="Enter post title..."
      rows={1}
      className="w-full resize-none overflow-hidden rounded-2xl border-2 border-border-strong bg-surface px-6 py-4 text-2xl font-black leading-snug text-foreground shadow-hard transition-all duration-200 placeholder:text-text-faint focus:translate-x-1 focus:translate-y-1 focus:shadow-none focus:outline-none"
    />
  );
}
