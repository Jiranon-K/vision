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

export interface SlashQuery {
  lineStart: number;
  query: string;
}

// Letters only: a space or punctuation is the Creator writing a path or a
// sentence, not narrowing a menu, so it ends the query rather than filtering
// on it.
const SLASH_QUERY_CHARS = /^[a-zA-Z]*$/;

// True only at the start of an otherwise-empty line: the slash must be the
// line's first character, and the caret must sit at the end of the line
// (nothing typed after it) so a `/` in the middle of a sentence never
// triggers the menu.
export function detectSlashQuery(value: string, cursorPos: number): SlashQuery | null {
  const lineStart = value.lastIndexOf("\n", cursorPos - 1) + 1;
  const lineEndIdx = value.indexOf("\n", cursorPos);
  const lineEnd = lineEndIdx === -1 ? value.length : lineEndIdx;

  if (cursorPos !== lineEnd) return null;
  if (value[lineStart] !== "/") return null;

  const query = value.slice(lineStart + 1, cursorPos);
  if (!SLASH_QUERY_CHARS.test(query)) return null;

  return { lineStart, query };
}

export interface BlockInsertion {
  before: string;
  after: string;
}

// Replaces the `/query` on the line (from lineStart through the caret) with
// a block insertion. The caret lands at the end of `before`, which is where
// a Creator continues typing for every option in the menu, including the
// code block whose `after` closes the fence below them.
export function applyBlockInsert(value: string, lineStart: number, cursorPos: number, insertion: BlockInsertion): TextEdit {
  const text = value.slice(0, lineStart) + insertion.before + insertion.after + value.slice(cursorPos);
  const pos = lineStart + insertion.before.length;
  return { text, selectionStart: pos, selectionEnd: pos };
}
