"use client";

import Markdown from "@/components/markdown/Markdown";
import type { MarkdownPreviewProps } from "./types";

export default function MarkdownPreview({ content }: MarkdownPreviewProps) {
  if (!content.trim()) {
    return (
      <div className="h-full flex items-center justify-center text-text-faint text-lg">
        Preview will appear here...
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-4 bg-surface rounded-2xl border-2 border-border-strong">
      <div className="prose prose-brand max-w-none">
        <Markdown content={content} />
      </div>
    </div>
  );
}
