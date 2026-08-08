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
  const { words, readTime } = useMemo(
    () => ({ words: countWords(content), readTime: computeReadTime(content) }),
    [content],
  );

  return (
    <div
      className={`hidden min-w-[11rem] shrink-0 items-center gap-1.5 truncate text-sm text-text-muted tabular-nums sm:flex ${className}`}
    >
      <span>{words.toLocaleString()} words</span>
      <span aria-hidden="true">·</span>
      <span>{readTime}</span>
    </div>
  );
}
