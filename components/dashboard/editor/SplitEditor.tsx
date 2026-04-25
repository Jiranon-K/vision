"use client";

import { useRef } from "react";
import MarkdownToolbar from "./MarkdownToolbar";
import MarkdownEditor from "./MarkdownEditor";
import MarkdownPreview from "./MarkdownPreview";
import type { SplitEditorProps } from "./types";

export default function SplitEditor({ value, onChange }: SplitEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div className="flex flex-col h-[500px]">
      
      <MarkdownToolbar textareaRef={textareaRef} />

      
      <div className="flex-1 flex gap-4 min-h-0">
        
        <div className="flex-1 min-w-0">
          <MarkdownEditor value={value} onChange={onChange} textareaRef={textareaRef} />
        </div>

        
        <div className="flex-1 min-w-0">
          <MarkdownPreview content={value} />
        </div>
      </div>
    </div>
  );
}
