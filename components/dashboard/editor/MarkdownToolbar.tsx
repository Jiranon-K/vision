"use client";

import { useRef, useCallback } from "react";
import type { ToolbarButton, MarkdownToolbarProps } from "./types";

const toolbarButtons: ToolbarButton[] = [
  { id: "bold", label: "Bold", icon: "B", syntax: { prefix: "**", suffix: "**", placeholder: "bold text" } },
  { id: "italic", label: "Italic", icon: "I", syntax: { prefix: "*", suffix: "*", placeholder: "italic text" } },
  { id: "h1", label: "Heading 1", icon: "H1", syntax: { prefix: "# ", suffix: "", placeholder: "Heading" } },
  { id: "h2", label: "Heading 2", icon: "H2", syntax: { prefix: "## ", suffix: "", placeholder: "Heading" } },
  { id: "h3", label: "Heading 3", icon: "H3", syntax: { prefix: "### ", suffix: "", placeholder: "Heading" } },
  { id: "link", label: "Link", icon: "🔗", syntax: { prefix: "[", suffix: "](url)", placeholder: "link text" } },
  { id: "image", label: "Image", icon: "🖼", syntax: { prefix: "![", suffix: "](url)", placeholder: "alt text" } },
  { id: "code", label: "Code", icon: "<>", syntax: { prefix: "`", suffix: "`", placeholder: "code" } },
  { id: "quote", label: "Quote", icon: '"', syntax: { prefix: "> ", suffix: "", placeholder: "quote" } },
  { id: "list", label: "List", icon: "•", syntax: { prefix: "- ", suffix: "", placeholder: "list item" } },
];

export default function MarkdownToolbar({ textareaRef }: MarkdownToolbarProps) {
  const insertSyntax = useCallback((prefix: string, suffix: string, placeholder: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end) || placeholder;

    const newText = text.substring(0, start) + prefix + selectedText + suffix + text.substring(end);
    textarea.value = newText;

    const newCursorPos = start + prefix.length + selectedText.length;
    textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    textarea.focus();

    const event = new Event("input", { bubbles: true });
    textarea.dispatchEvent(event);
  }, [textareaRef]);

  return (
    <div className="flex flex-wrap gap-1 p-2 bg-brand-gray rounded-[12px] border-2 border-brand-dark/20 mb-2">
      {toolbarButtons.map((btn) => (
        <button
          key={btn.id}
          type="button"
          onClick={() => insertSyntax(btn.syntax.prefix, btn.syntax.suffix, btn.syntax.placeholder || "")}
          title={btn.label}
          className="w-9 h-9 flex items-center justify-center rounded-[8px] bg-white border-2 border-brand-dark/20 text-brand-dark font-bold text-sm hover:border-brand-dark hover:bg-brand-lime transition-all duration-200"
        >
          {btn.icon}
        </button>
      ))}
    </div>
  );
}
