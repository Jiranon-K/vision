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
          className="w-full h-full min-h-[400px] p-4 rounded-[16px] border-2 border-brand-dark bg-white resize-none focus:outline-none focus:border-brand-dark font-mono text-sm leading-relaxed text-brand-dark placeholder:text-brand-dark/30"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
