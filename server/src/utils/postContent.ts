// Single source of truth for derived post fields. The frontend used to compute
// these in the save handler with `content.split(" ")`, which counts an entire
// Thai paragraph (no spaces) as one word — so readTime was always "1 min read".
// Intl.Segmenter with word granularity segments Thai and Latin correctly.

const WORDS_PER_MINUTE = 200;
const EXCERPT_MAX = 500;
const EXCERPT_TARGET = 150;

// Minimal local types — the server's tsconfig lib is ES2020, which predates the
// Intl.Segmenter type definitions, but the runtime (Node 20+/Bun) has it.
interface WordSegment {
  isWordLike?: boolean;
}
interface SegmenterLike {
  segment(input: string): Iterable<WordSegment>;
}
interface SegmenterCtor {
  new (
    locales?: string | string[],
    options?: { granularity?: 'grapheme' | 'word' | 'sentence' }
  ): SegmenterLike;
}

function countWords(content: string): number {
  const ctor = (Intl as unknown as { Segmenter?: SegmenterCtor }).Segmenter;
  if (ctor) {
    const segmenter = new ctor(undefined, { granularity: 'word' });
    let words = 0;
    for (const seg of segmenter.segment(content)) {
      if (seg.isWordLike) {
        words++;
      }
    }
    return words;
  }

  // Fallback for runtimes without Intl.Segmenter. Latin-only.
  return content.trim().split(/\s+/).filter(Boolean).length;
}

export function computeReadTime(content: string): string {
  const words = countWords(content);
  const minutes = Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
  return `${minutes} min read`;
}

// Strip the most common Markdown syntax so the excerpt reads as plain prose.
function stripMarkdown(content: string): string {
  return content
    .replace(/```[\s\S]*?```/g, ' ') // fenced code blocks
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // links → text
    .replace(/^\s{0,3}#{1,6}\s+/gm, '') // headings
    .replace(/^\s{0,3}>\s?/gm, '') // blockquotes
    .replace(/^\s{0,3}[-*+]\s+/gm, '') // unordered list markers
    .replace(/^\s{0,3}\d+\.\s+/gm, '') // ordered list markers
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // bold
    .replace(/(\*|_)(.*?)\1/g, '$2') // italic
    .replace(/\s+/g, ' ') // collapse whitespace
    .trim();
}

// Slice without splitting a surrogate pair, so a cut at a Thai/emoji boundary
// never emits a broken half-character.
function safeSlice(text: string, max: number): string {
  if (text.length <= max) {
    return text;
  }
  let end = max;
  const code = text.charCodeAt(end - 1);
  if (code >= 0xd800 && code <= 0xdbff) {
    end -= 1; // would cut a high surrogate — back off one unit
  }
  return text.slice(0, end);
}

export function deriveExcerpt(content: string, provided?: string): string {
  const trimmed = provided?.trim();
  if (trimmed) {
    return safeSlice(trimmed, EXCERPT_MAX);
  }

  // Fall back through stripped → trimmed → raw so the result is never empty
  // (the Post model requires excerpt; content is already guaranteed non-empty).
  const source = stripMarkdown(content) || content.trim() || content;
  if (source.length <= EXCERPT_TARGET) {
    return source;
  }
  return safeSlice(source, EXCERPT_TARGET).trimEnd() + '...';
}
