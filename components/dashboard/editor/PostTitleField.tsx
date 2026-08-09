"use client";

import { useLayoutEffect, useRef } from "react";

export interface PostTitleFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** True in Split, where the column is half as wide and 34px display type
   *  stops fitting on one line. */
  narrow?: boolean;
}

// The title is the first line of the Post, not a setting about it — sized
// and weighted as display type, and never allowed to clip or scroll.
export default function PostTitleField({ value, onChange, narrow = false }: PostTitleFieldProps) {
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
      placeholder="Untitled Post"
      aria-label="Post title"
      rows={1}
      // No box at all: no border, no fill, no shadow. The title is the first
      // line of the Post, not a field about it — the design gives it display
      // type on the writing surface itself, and a border would put it back in
      // a form. The global focus ring is left alone.
      className={`block w-full resize-none overflow-hidden border-none bg-transparent font-black leading-[1.15] tracking-[-0.03em] text-foreground placeholder:text-text-faint ${
        // 34px display type only where the measure is full width: the design
        // steps it down to 28 for its tablet and for Split, and to 26 on a
        // phone, where a title that size would wrap to four lines.
        narrow
          ? "px-8 pb-3 pt-[30px] text-[28px]"
          : "px-5 pb-2.5 pt-[22px] text-[26px] md:px-8 md:pb-3 md:pt-[30px] md:text-[28px] lg:px-12 lg:pb-3.5 lg:pt-10 lg:text-[34px]"
      }`}
    />
  );
}
