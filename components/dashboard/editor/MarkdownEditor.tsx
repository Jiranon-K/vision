"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { applyHeading, applyBlockInsert, applyWrap, detectSlashQuery, type SlashQuery } from "./markdownOps";
import { getCaretCoordinates } from "./caretCoordinates";
import SlashMenu, { filterSlashOptions, type SlashMenuAnchor } from "./SlashMenu";
import type { MarkdownEditorProps, SlashMenuOption } from "./types";

// Keyed by `code`, not `key`: holding Alt changes the character a digit row
// key produces on several layouts, so `key` would be "1" for some Creators
// and something else entirely for others. `code` is the physical key.
const HEADING_LEVELS = { Digit1: 1, Digit2: 2, Digit3: 3 } as const;

// The three the toolbar hint promises. Plain Ctrl/Cmd (no Alt) is safe here
// where the digit row is not: browsers bind B/I/K inside a text field to
// nothing they will not let the page have.
const WRAP_SHORTCUTS = {
  KeyB: { prefix: "**", suffix: "**", placeholder: "bold text" },
  KeyI: { prefix: "*", suffix: "*", placeholder: "italic text" },
  KeyK: { prefix: "[", suffix: "](url)", placeholder: "link text" },
} as const;

// Surfaced to assistive tech via aria-describedby below, since the buttons
// that used to carry H1/H2/H3 are gone — the shortcut has to be discoverable
// from the surface itself now.
// Alt is not decoration. Ctrl/Cmd+1..3 is the browser's own accelerator for
// switching to tab N, intercepted above the page — a Creator pressing it would
// lose the editor rather than gain a heading, and preventDefault never runs.
// Ctrl/Cmd+Alt+1..3 is what Google Docs and Notion bind headings to, for the
// same reason.
const HEADING_SHORTCUT_HINT =
  "Ctrl+Alt+1, Ctrl+Alt+2 or Ctrl+Alt+3 (Cmd+Alt on Mac) applies a heading level to the current line. Typing # at the start of a line also works. Typing / at the start of an empty line opens a menu of block insertions.";

const SLASH_LISTBOX_ID = "markdown-slash-menu";
const optionId = (id: string) => `markdown-slash-option-${id}`;

export default function MarkdownEditor({ value, onChange, textareaRef }: MarkdownEditorProps) {
  // Same pattern as MarkdownToolbar: onChange is a controlled update, so the
  // caret can only be repositioned once React has committed the new value.
  const pendingSelection = useRef<{ start: number; end: number } | null>(null);

  const [slashQuery, setSlashQuery] = useState<SlashQuery | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [anchor, setAnchor] = useState<SlashMenuAnchor | null>(null);

  const filteredOptions = useMemo(() => (slashQuery ? filterSlashOptions(slashQuery.query) : []), [slashQuery]);

  // The filter narrowing the list is exactly when the previous activeIndex
  // can point past the end of it (or at an option that scrolled away), so it
  // resets to the top on every query change. Done during render (React's
  // sanctioned pattern for resetting state derived from a changing value)
  // rather than in an effect, which would cost an extra commit.
  const lastQueryRef = useRef<string | undefined>(undefined);
  if (slashQuery?.query !== lastQueryRef.current) {
    lastQueryRef.current = slashQuery?.query;
    if (activeIndex !== 0) setActiveIndex(0);
  }

  useLayoutEffect(() => {
    const pending = pendingSelection.current;
    if (!pending) return;
    pendingSelection.current = null;
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.setSelectionRange(pending.start, pending.end);
  }, [value, textareaRef]);

  // Recomputes the menu's anchor (the caret's viewport position) whenever
  // the slash query changes and while the window resizes or the textarea's
  // own content scrolls under it — a stale anchor would leave the menu
  // pinned to where the caret used to be.
  useLayoutEffect(() => {
    // Nothing to reposition when the menu is closed — `anchor` is only ever
    // read while `slashQuery` is truthy (see the render below), so a stale
    // value left in state here is inert rather than reset.
    if (!slashQuery) return;
    const textarea = textareaRef.current;
    if (!textarea) return;

    const updateAnchor = () => {
      const rect = textarea.getBoundingClientRect();
      const caret = getCaretCoordinates(textarea, slashQuery.lineStart);
      setAnchor({ top: rect.top + caret.top, left: rect.left + caret.left, height: caret.height });
    };

    updateAnchor();
    window.addEventListener("resize", updateAnchor);
    window.addEventListener("scroll", updateAnchor, true);
    return () => {
      window.removeEventListener("resize", updateAnchor);
      window.removeEventListener("scroll", updateAnchor, true);
    };
  }, [slashQuery, textareaRef]);

  const syncSlashQuery = useCallback((text: string, cursorPos: number) => {
    setSlashQuery(detectSlashQuery(text, cursorPos));
  }, []);

  const insertBlock = useCallback(
    (option: SlashMenuOption) => {
      const textarea = textareaRef.current;
      if (!textarea || !slashQuery) return;

      const { text, selectionStart, selectionEnd } = applyBlockInsert(
        value,
        slashQuery.lineStart,
        textarea.selectionStart,
        option.insertion
      );

      pendingSelection.current = { start: selectionStart, end: selectionEnd };
      setSlashQuery(null);
      onChange(text);
    },
    [slashQuery, value, onChange, textareaRef]
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
      syncSlashQuery(e.target.value, e.target.selectionStart);
    },
    [onChange, syncSlashQuery]
  );

  const handleSelect = useCallback(
    (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
      // Fires on clicks and arrow-key moves too, not just typing — a Creator
      // clicking away from the slash line closes the menu the same way
      // Escape does, without touching what they typed.
      syncSlashQuery(e.currentTarget.value, e.currentTarget.selectionStart);
    },
    [syncSlashQuery]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // The menu's own keys are handled first and return early; anything
      // else (letters, Backspace, punctuation) falls through untouched so
      // the textarea keeps handling ordinary typing and the filter keeps
      // seeing every keystroke. Mod+Alt+1-3 below never collides with these,
      // so the two handlers can share one function without either
      // swallowing the other.
      if (slashQuery) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          if (filteredOptions.length > 0) {
            const delta = e.key === "ArrowDown" ? 1 : -1;
            setActiveIndex((i) => (i + delta + filteredOptions.length) % filteredOptions.length);
          }
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          const option = filteredOptions[activeIndex];
          if (option) insertBlock(option);
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          // Closes the popup only. The `/` and whatever follows it are
          // already in the text as ordinary characters — a Creator writing
          // about a file path types `/` and means it.
          setSlashQuery(null);
          return;
        }
      }

      const mod = e.metaKey || e.ctrlKey;

      if (mod && !e.altKey && !e.shiftKey && e.code in WRAP_SHORTCUTS) {
        e.preventDefault();
        const textarea = e.currentTarget;
        const { prefix, suffix, placeholder } = WRAP_SHORTCUTS[e.code as keyof typeof WRAP_SHORTCUTS];
        const wrapped = applyWrap(
          value,
          textarea.selectionStart,
          textarea.selectionEnd,
          prefix,
          suffix,
          placeholder
        );
        pendingSelection.current = { start: wrapped.selectionStart, end: wrapped.selectionEnd };
        onChange(wrapped.text);
        return;
      }

      const isMod = mod && e.altKey && !e.shiftKey;
      if (!isMod || !(e.code in HEADING_LEVELS)) return;

      e.preventDefault();
      const textarea = e.currentTarget;
      const level = HEADING_LEVELS[e.code as keyof typeof HEADING_LEVELS];
      const { text, selectionStart, selectionEnd } = applyHeading(value, textarea.selectionStart, level);

      pendingSelection.current = { start: selectionStart, end: selectionEnd };
      onChange(text);
    },
    [slashQuery, filteredOptions, activeIndex, insertBlock, value, onChange]
  );

  const activeOption = slashQuery ? filteredOptions[activeIndex] : undefined;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onSelect={handleSelect}
          onKeyDown={handleKeyDown}
          placeholder="Start writing. Markdown works; so does thinking out loud."
          aria-label="Post content"
          aria-describedby="markdown-heading-shortcuts"
          aria-keyshortcuts="Control+Alt+1 Control+Alt+2 Control+Alt+3 Meta+Alt+1 Meta+Alt+2 Meta+Alt+3"
          aria-haspopup={slashQuery ? "listbox" : undefined}
          aria-controls={slashQuery ? SLASH_LISTBOX_ID : undefined}
          aria-activedescendant={activeOption ? optionId(activeOption.id) : undefined}
          // Borderless and centred on its own 780px measure: the page is the
          // paper, so the writing surface has no edge of its own, and line
          // length is a decision rather than whatever the window happens to
          // be. The whole width stays clickable — only the text is capped.
          className="mx-auto w-full max-w-[780px] flex-1 resize-none border-none bg-transparent px-5 pb-6 pt-3.5 font-mono text-sm leading-[1.85] text-foreground placeholder:text-text-faint md:px-12 md:pb-10 md:pt-[18px] md:text-[14.5px]"
          spellCheck={false}
        />
        <p id="markdown-heading-shortcuts" className="sr-only">
          {HEADING_SHORTCUT_HINT}
        </p>
      </div>
      {slashQuery && anchor && (
        <SlashMenu
          options={filteredOptions}
          activeIndex={activeIndex}
          anchor={anchor}
          onSelect={insertBlock}
          onHover={setActiveIndex}
          listboxId={SLASH_LISTBOX_ID}
          getOptionId={optionId}
        />
      )}
    </div>
  );
}
