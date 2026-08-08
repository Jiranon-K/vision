// Pure text operations shared by the toolbar buttons and the heading
// keyboard shortcuts. Kept free of React/DOM so the selection math is easy
// to reason about independently of when/how it gets committed.

export interface TextEdit {
  text: string;
  selectionStart: number;
  selectionEnd: number;
}

// Wraps the current selection in prefix/suffix, or — with nothing selected —
// inserts the placeholder and selects it so the Creator types over it.
export function applyWrap(
  value: string,
  start: number,
  end: number,
  prefix: string,
  suffix: string,
  placeholder: string
): TextEdit {
  const selected = value.slice(start, end) || placeholder;
  const text = value.slice(0, start) + prefix + selected + suffix + value.slice(end);
  return {
    text,
    selectionStart: start + prefix.length,
    selectionEnd: start + prefix.length + selected.length,
  };
}

const HEADING_PREFIX = /^#{1,6}\s*/;

// Applies (or replaces) a heading level on the line the caret sits in.
// Preserves the caret's position relative to the line's content, not its
// raw offset, since the prefix itself changes length.
export function applyHeading(value: string, cursorPos: number, level: 1 | 2 | 3): TextEdit {
  const lineStart = value.lastIndexOf("\n", cursorPos - 1) + 1;
  const lineEndIdx = value.indexOf("\n", cursorPos);
  const lineEnd = lineEndIdx === -1 ? value.length : lineEndIdx;

  const line = value.slice(lineStart, lineEnd);
  const existingPrefix = line.match(HEADING_PREFIX)?.[0] ?? "";
  const content = line.slice(existingPrefix.length);
  const newPrefix = "#".repeat(level) + " ";

  const text = value.slice(0, lineStart) + newPrefix + content + value.slice(lineEnd);

  const offsetInLine = Math.max(0, cursorPos - lineStart - existingPrefix.length);
  const newPos = lineStart + newPrefix.length + offsetInLine;

  return { text, selectionStart: newPos, selectionEnd: newPos };
}
