// The owned seam from ADR 0003: this module knows the prompt and the shape of
// an Excerpt Suggestion; it never knows which provider or model answered.
// The provider call is injected (GenerateText) rather than imported, so this
// module's own logic — prompt construction and output sanitising — is
// exercisable with a fake and carries no I/O of its own.

import { safeSlice, stripMarkdown, EXCERPT_MAX } from '../utils/postContent';

export type GenerateText = (prompt: string) => Promise<string>;

function buildPrompt(content: string): string {
  return [
    'Write a short summary of the following content, in the same language as the content.',
    'Respond with plain prose only: no Markdown, no headings, no bullet points, no surrounding quotes.',
    'The summary must read naturally as a short excerpt introducing the content.',
    '',
    'Content:',
    content,
  ].join('\n');
}

// A provider's output is untrusted: it may wrap the answer in quotes, use
// Markdown despite the prompt, or run past the Excerpt bound. Strip and bound
// it before it is treated as an Excerpt Suggestion.
function sanitizeSuggestion(raw: string): string {
  let text = raw.trim();

  // Strip one layer of wrapping quotes (straight or curly) a provider adds
  // around what it treats as "the answer".
  const quotePairs: [string, string][] = [
    ['"', '"'],
    ["'", "'"],
    ['“', '”'],
    ['‘', '’'],
  ];
  for (const [open, close] of quotePairs) {
    if (text.startsWith(open) && text.endsWith(close) && text.length >= open.length + close.length) {
      text = text.slice(open.length, text.length - close.length).trim();
      break;
    }
  }

  // stripMarkdown also collapses whitespace, so a multi-line answer arrives as
  // one line of prose — which is what the Excerpt field and the meta
  // description built from it both need.
  text = stripMarkdown(text);

  return safeSlice(text, EXCERPT_MAX);
}

export async function suggestExcerpt(
  content: string,
  generateText: GenerateText
): Promise<string> {
  const raw = await generateText(buildPrompt(content));
  return sanitizeSuggestion(raw);
}
