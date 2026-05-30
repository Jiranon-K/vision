import { describe, it, expect } from 'vitest';
import { computeReadTime, deriveExcerpt } from '../../src/utils/postContent';

describe('computeReadTime', () => {
  it('formats as "<n> min read"', () => {
    expect(computeReadTime('hello world')).toMatch(/^\d+ min read$/);
  });

  it('scales with Latin word count at ~200 wpm', () => {
    expect(computeReadTime('word '.repeat(400))).toBe('2 min read');
  });

  it('never returns less than 1 minute', () => {
    expect(computeReadTime('')).toBe('1 min read');
  });

  it('handles Thai (no spaces) without throwing and stays well-formed', () => {
    // Strict word count depends on the runtime ICU Thai dictionary, so we assert
    // only the format here; the regression being prevented is a crash / NaN.
    const thai = 'การตลาดดิจิทัลสำหรับธุรกิจ'.repeat(50);
    expect(computeReadTime(thai)).toMatch(/^\d+ min read$/);
  });
});

describe('deriveExcerpt', () => {
  it('uses a provided excerpt verbatim (trimmed)', () => {
    expect(deriveExcerpt('body', '  My summary  ')).toBe('My summary');
  });

  it('caps a provided excerpt at 500 chars', () => {
    expect(deriveExcerpt('body', 'x'.repeat(600))).toHaveLength(500);
  });

  it('derives from content when excerpt is blank, stripping markdown', () => {
    const out = deriveExcerpt('# Title\n\nSome **bold** text', '');
    expect(out).toContain('Some bold text');
    expect(out).not.toContain('#');
    expect(out).not.toContain('**');
  });

  it('returns a non-empty excerpt when content strips to nothing', () => {
    // Old behavior produced '' here, which violated Post.excerpt required:true.
    expect(deriveExcerpt('#   ', '').length).toBeGreaterThan(0);
  });

  it('does not split a surrogate pair at the truncation boundary', () => {
    const out = deriveExcerpt('x' + '😀'.repeat(100), '');
    const loneSurrogate =
      /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;
    expect(loneSurrogate.test(out)).toBe(false);
  });
});
