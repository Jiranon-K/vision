"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ListIcon,
  OrderedListIcon,
  QuoteIcon,
  CodeIcon,
  HorizontalRuleIcon,
} from "@/components/ui/Icons";
import type { SlashMenuOption } from "./types";

// Block-level insertions only, matching direction 1b's toolbar rule from the
// other side: these are exactly what ticket 06 dropped (headings, lists,
// quote, code block) plus a numbered list and a divider, which are block
// markdown a Creator reaches for just as often but has no keyboard-fast path
// to otherwise. Inline marks (bold, italic, link, image, inline code) already
// live on the toolbar and stay off this menu.
export const SLASH_OPTIONS: SlashMenuOption[] = [
  { id: "h1", label: "Heading 1", keywords: "heading 1 h1", icon: Heading1Icon, insertion: { before: "# ", after: "" } },
  { id: "h2", label: "Heading 2", keywords: "heading 2 h2", icon: Heading2Icon, insertion: { before: "## ", after: "" } },
  { id: "h3", label: "Heading 3", keywords: "heading 3 h3", icon: Heading3Icon, insertion: { before: "### ", after: "" } },
  {
    id: "bulleted-list",
    label: "Bulleted list",
    keywords: "bulleted list unordered ul",
    icon: ListIcon,
    insertion: { before: "- ", after: "" },
  },
  {
    id: "numbered-list",
    label: "Numbered list",
    keywords: "numbered list ordered ol",
    icon: OrderedListIcon,
    insertion: { before: "1. ", after: "" },
  },
  { id: "quote", label: "Quote", keywords: "quote blockquote", icon: QuoteIcon, insertion: { before: "> ", after: "" } },
  {
    id: "code-block",
    label: "Code block",
    keywords: "code block fence",
    icon: CodeIcon,
    insertion: { before: "```\n", after: "\n```" },
  },
  {
    id: "divider",
    label: "Divider",
    keywords: "divider horizontal rule hr",
    icon: HorizontalRuleIcon,
    insertion: { before: "---\n", after: "" },
  },
];

export function filterSlashOptions(query: string): SlashMenuOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return SLASH_OPTIONS;
  return SLASH_OPTIONS.filter((option) => option.keywords.includes(q));
}

export interface SlashMenuAnchor {
  /** Viewport coordinates of the top-left corner of the line the caret sits on. */
  top: number;
  left: number;
  height: number;
}

interface SlashMenuProps {
  options: SlashMenuOption[];
  activeIndex: number;
  anchor: SlashMenuAnchor;
  onSelect: (option: SlashMenuOption) => void;
  onHover: (index: number) => void;
  listboxId: string;
  getOptionId: (id: string) => string;
}

const MENU_MARGIN = 8;

export default function SlashMenu({ options, activeIndex, anchor, onSelect, onHover, listboxId, getOptionId }: SlashMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Two-pass placement: render below the caret first — the common case —
  // then measure the menu's actual height (it varies with how many options
  // survive the filter) and flip above if that would run past the viewport.
  // A fixed-height guess would either overshoot near the bottom of the
  // window or leave a gap when the list is short.
  const [placement, setPlacement] = useState({
    top: anchor.top + anchor.height,
    left: anchor.left,
  });

  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const rect = menu.getBoundingClientRect();

    const fitsBelow = anchor.top + anchor.height + rect.height + MENU_MARGIN <= window.innerHeight;
    const top = fitsBelow ? anchor.top + anchor.height : anchor.top - rect.height;
    const left = Math.min(Math.max(anchor.left, MENU_MARGIN), window.innerWidth - rect.width - MENU_MARGIN);

    setPlacement((prev) => (prev.top === top && prev.left === left ? prev : { top, left }));
  }, [anchor.top, anchor.left, anchor.height, options.length]);

  // Portalled to <body> rather than rendered in place: the editor's panes
  // (SplitEditor's `Pane`) carry a Tailwind `translate-x-*` class for their
  // entrance animation, and any non-"none" `transform` on an ancestor turns
  // it into the containing block for `position: fixed` descendants — the
  // menu would then be positioned relative to that pane instead of the
  // viewport, undoing the flip/clamp math below.
  return createPortal(
    <div
      ref={menuRef}
      role="listbox"
      id={listboxId}
      aria-label="Insert a block"
      style={{ position: "fixed", top: placement.top, left: placement.left }}
      className="z-50 max-h-64 w-56 overflow-y-auto rounded-xl border border-border bg-surface p-1.5 shadow-panel"
    >
      {options.length === 0 ? (
        <p className="px-2 py-1.5 text-sm text-text-muted">No matches</p>
      ) : (
        options.map((option, index) => {
          const Icon = option.icon;
          const active = index === activeIndex;
          return (
            <div
              key={option.id}
              id={getOptionId(option.id)}
              role="option"
              aria-selected={active}
              // mousedown, not click: preventDefault here stops the browser
              // from blurring the textarea (and losing the caret position)
              // before onSelect runs.
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(option);
              }}
              onMouseEnter={() => onHover(index)}
              className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground ${
                active ? "bg-state-selected" : ""
              }`}
            >
              <Icon className="size-4 shrink-0" />
              {option.label}
            </div>
          );
        })
      )}
    </div>,
    document.body
  );
}
