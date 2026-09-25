"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
import { BoldIcon, ItalicIcon, LinkIcon, ImageIcon, CodeIcon, QuoteIcon, ListIcon } from "@/components/ui/Icons";
import { applyWrap } from "./markdownOps";
import type { ToolbarButton, MarkdownToolbarProps } from "./types";

// Ten buttons become seven under direction 1b's rule: a slot is earned only
// by Markdown that needs a second value the Creator can't type in flow (a
// URL, a path) or that wraps a selection. Headings fail that test — `#` is
// faster to type than a button is to aim at — so they move to the keyboard
// (see the Ctrl/Cmd+1-3 handler in MarkdownEditor).
const toolbarButtons: ToolbarButton[] = [
  { id: "bold", label: "Bold", icon: BoldIcon, syntax: { prefix: "**", suffix: "**", placeholder: "bold text" } },
  { id: "italic", label: "Italic", icon: ItalicIcon, syntax: { prefix: "*", suffix: "*", placeholder: "italic text" } },
  { id: "link", label: "Link", icon: LinkIcon, syntax: { prefix: "[", suffix: "](url)", placeholder: "link text" } },
  { id: "image", label: "Image", icon: ImageIcon, syntax: { prefix: "![", suffix: "](url)", placeholder: "alt text" } },
  { id: "code", label: "Code", icon: CodeIcon, syntax: { prefix: "`", suffix: "`", placeholder: "code" } },
  { id: "quote", label: "Quote", icon: QuoteIcon, syntax: { prefix: "> ", suffix: "", placeholder: "quote" } },
  { id: "list", label: "List", icon: ListIcon, syntax: { prefix: "- ", suffix: "", placeholder: "list item" } },
];

export default function MarkdownToolbar({ textareaRef, value, onChange }: MarkdownToolbarProps) {
  // The insertion is a controlled update (onChange), not a direct DOM
  // mutation — but setSelectionRange has to run *after* React commits the
  // new value to the textarea, or it lands on the pre-edit text. This ref
  // carries the target selection across that gap to the layout effect below.
  const pendingSelection = useRef<{ start: number; end: number } | null>(null);

  useLayoutEffect(() => {
    const pending = pendingSelection.current;
    if (!pending) return;
    pendingSelection.current = null;
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.setSelectionRange(pending.start, pending.end);
    textarea.focus();
  }, [value, textareaRef]);

  const insertSyntax = useCallback(
    (prefix: string, suffix: string, placeholder: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const { text, selectionStart, selectionEnd } = applyWrap(
        value,
        textarea.selectionStart,
        textarea.selectionEnd,
        prefix,
        suffix,
        placeholder
      );

      pendingSelection.current = { start: selectionStart, end: selectionEnd };
      onChange(text);
    },
    [textareaRef, value, onChange]
  );

  return (
    // Not a box: a row of bare glyphs on the writing surface, closed by one
    // hairline. flex-nowrap + overflow-x-auto instead of flex-wrap so mobile
    // scrolls sideways rather than dropping to a second row of half-width
    // targets, which is what the ticket rules out.
    <div className="mb-0.5 flex flex-nowrap items-center gap-0.5 overflow-x-auto border-b border-border-subtle px-3 pb-2 md:px-10">
      {toolbarButtons.map((btn) => {
        const Icon = btn.icon;
        return (
          <button
            key={btn.id}
            type="button"
            onClick={() => insertSyntax(btn.syntax.prefix, btn.syntax.suffix, btn.syntax.placeholder || "")}
            aria-label={btn.label}
            title={btn.label}
            // No focus:outline or ring override here, so the global
            // *:focus-visible ring shows.
            className="flex size-[34px] shrink-0 items-center justify-center rounded-lg border-2 border-transparent text-foreground transition-colors hover:border-border hover:bg-surface-muted active:bg-state-active"
          >
            <Icon className="size-[18px]" />
          </button>
        );
      })}

      {/* The shortcuts the toolbar deliberately doesn't carry a button for —
          stated on the surface rather than left to be discovered. Withdraws
          before the buttons do, since a hint is worth less than a target. */}
      <div aria-hidden="true" className="mx-2.5 hidden h-5 w-px shrink-0 bg-border-subtle lg:block" />
      <span className="hidden whitespace-nowrap font-mono text-[11px] text-text-faint lg:inline">
        ⌘B ⌘I ⌘K · type / for everything else
      </span>
    </div>
  );
}
