"use client";

import Markdown from "@/components/markdown/Markdown";
import type { MarkdownPreviewProps } from "./types";

export default function MarkdownPreview({ content }: MarkdownPreviewProps) {
  if (!content.trim()) {
    return (
      <div className="flex h-full items-center justify-center px-5 text-text-faint italic md:px-12">
        Your Post appears here as you write it.
      </div>
    );
  }

  // No card and no border — the preview is the same sheet of paper as the
  // writing surface, on the same measure, so switching modes never changes
  // what the Post looks like, only what it is made of.
  return (
    <div className="h-full overflow-auto px-5 py-7 md:px-12 md:py-11">
      <div className="prose prose-brand mx-auto max-w-[780px]">
        <Markdown content={content} />
      </div>
    </div>
  );
}
