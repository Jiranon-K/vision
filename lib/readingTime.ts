// Client-side mirror of server/src/utils/postContent.ts's word/read-time
// math. Not a shared import — server/ is a separate deployable with its own
// tsconfig (root tsconfig excludes it) — so this duplicates the approach
// deliberately rather than reaching across the package boundary. Keep the
// two in sync by hand if `WORDS_PER_MINUTE` or the segmentation strategy
// changes.
//
// Intl.Segmenter with word granularity is what makes this safe for Thai:
// Thai has no spaces between words, so `content.split(" ")` counts an entire
// paragraph as one "word" and reading time is always "1 min read".

const WORDS_PER_MINUTE = 200;

interface WordSegment {
  isWordLike?: boolean;
}
interface SegmenterLike {
  segment(input: string): Iterable<WordSegment>;
}
interface SegmenterCtor {
  new (
    locales?: string | string[],
    options?: { granularity?: "grapheme" | "word" | "sentence" },
  ): SegmenterLike;
}

export function countWords(content: string): number {
  const ctor = (Intl as unknown as { Segmenter?: SegmenterCtor }).Segmenter;
  if (ctor) {
    const segmenter = new ctor(undefined, { granularity: "word" });
    let words = 0;
    for (const seg of segmenter.segment(content)) {
      if (seg.isWordLike) {
        words++;
      }
    }
    return words;
  }

  // Fallback for runtimes without Intl.Segmenter. Latin-only, same as the
  // server's fallback.
  return content.trim().split(/\s+/).filter(Boolean).length;
}

export function computeReadTime(content: string): string {
  const words = countWords(content);
  const minutes = Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
  return `${minutes} min read`;
}
