import { describe, it, expect, vi } from 'vitest';
import { suggestExcerpt } from '../../src/ai/excerptSuggestion';

describe('suggestExcerpt', () => {
  it('carries the content into the prompt passed to the provider', async () => {
    const generateText = vi.fn().mockResolvedValue('a summary');
    await suggestExcerpt('unique content marker 123', generateText);

    expect(generateText).toHaveBeenCalledTimes(1);
    const prompt = generateText.mock.calls[0][0] as string;
    expect(prompt).toContain('unique content marker 123');
  });

  it('keeps a Thai suggestion Thai', async () => {
    const thai = 'สวัสดีชาวโลก นี่คือบทสรุปสั้นๆ';
    const generateText = vi.fn().mockResolvedValue(thai);
    const result = await suggestExcerpt('เนื้อหาภาษาไทย', generateText);
    expect(result).toBe(thai);
  });

  it('keeps an English suggestion English', async () => {
    const generateText = vi.fn().mockResolvedValue('A short English summary.');
    const result = await suggestExcerpt('Some English content.', generateText);
    expect(result).toBe('A short English summary.');
  });

  it('bounds an over-long response without breaking a multi-byte character', async () => {
    const generateText = vi.fn().mockResolvedValue('😀'.repeat(600));
    const result = await suggestExcerpt('content', generateText);
    expect(result.length).toBeLessThanOrEqual(500);

    const loneSurrogate =
      /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;
    expect(loneSurrogate.test(result)).toBe(false);
  });

  it('bounds an over-long Thai response without breaking a character', async () => {
    const generateText = vi.fn().mockResolvedValue('การตลาดดิจิทัล'.repeat(60));
    const result = await suggestExcerpt('content', generateText);
    expect(result.length).toBeLessThanOrEqual(500);
  });

  it('strips one layer of surrounding quote wrapping', async () => {
    const generateText = vi.fn().mockResolvedValue('"A quoted summary"');
    const result = await suggestExcerpt('content', generateText);
    expect(result).toBe('A quoted summary');
  });

  it('strips curly quote wrapping too', async () => {
    const generateText = vi.fn().mockResolvedValue('“A curly-quoted summary”');
    const result = await suggestExcerpt('content', generateText);
    expect(result).toBe('A curly-quoted summary');
  });

  it('strips Markdown the provider emitted despite being asked not to', async () => {
    const generateText = vi
      .fn()
      .mockResolvedValue('## A **bold** guide to [SEO](https://example.com)');
    const result = await suggestExcerpt('content', generateText);
    expect(result).toBe('A bold guide to SEO');
  });

  it('collapses embedded newlines into single spaces', async () => {
    const generateText = vi.fn().mockResolvedValue('Line one\nLine two\n\nLine three');
    const result = await suggestExcerpt('content', generateText);
    expect(result).toBe('Line one Line two Line three');
  });

  it('trims surrounding whitespace', async () => {
    const generateText = vi.fn().mockResolvedValue('   padded summary   ');
    const result = await suggestExcerpt('content', generateText);
    expect(result).toBe('padded summary');
  });
});
