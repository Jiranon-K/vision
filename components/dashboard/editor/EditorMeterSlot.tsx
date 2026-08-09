"use client";

import { useMemo } from "react";
import { countWords, computeReadTime } from "@/lib/readingTime";

export interface EditorMeterSlotProps {
  content: string;
  className?: string;
}

// Fills the slot ticket 01 left empty. Reading time is already computed and
// shown wherever a Post appears (see server/src/utils/postContent.ts) — the
// Creator writing it is the one person who can't see it until now.
export default function EditorMeterSlot({ content, className = "" }: EditorMeterSlotProps) {
  const { words, readTime } = useMemo(() => {
    const words = countWords(content);
    // An empty Post takes no time to read. computeReadTime floors at one
    // minute because that is right everywhere it is shown to a Reader —
    // here, on a Post with nothing in it, it would just be wrong.
    return { words, readTime: words === 0 ? "0 min read" : computeReadTime(content) };
  }, [content]);

  return (
    // Mono, faint, and never wrapping — the meter is the quietest thing on
    // the bar, and it withdraws entirely below the width where the mode
    // switch needs the room.
    <div
      className={`hidden shrink-0 items-center gap-[7px] whitespace-nowrap font-mono text-xs tabular-nums text-text-faint md:flex ${className}`}
    >
      <span>{words.toLocaleString()} words</span>
      <span aria-hidden="true" className="opacity-40">
        /
      </span>
      <span>{readTime}</span>
    </div>
  );
}
