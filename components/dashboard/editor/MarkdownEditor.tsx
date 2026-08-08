"use client";

import type { MarkdownEditorProps } from "./types";

export default function MarkdownEditor({ value, onChange, textareaRef }: MarkdownEditorProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write your post content in Markdown..."
          className="w-full h-full min-h-[400px] p-4 rounded-2xl border-2 border-border-strong bg-surface resize-none focus:outline-none focus:border-border-strong font-mono text-sm leading-relaxed text-foreground placeholder:text-text-faint"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
