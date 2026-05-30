"use client";

import ReactMarkdown from "react-markdown";
import { markdownComponents } from "@/components/markdown/MarkdownComponents";
import type { MarkdownPreviewProps } from "./types";

export default function MarkdownPreview({ content }: MarkdownPreviewProps) {
  if (!content.trim()) {
    return (
      <div className="h-full flex items-center justify-center text-brand-dark/30 text-lg">
        Preview will appear here...
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-4 bg-white rounded-[16px] border-2 border-brand-dark">
      <div className="prose prose-brand max-w-none">
        <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
