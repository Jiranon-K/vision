// Chooses what backs the Excerpt Suggestion seam. This is the only place in
// the repo that knows a provider's name — server/src/ai/excerptSuggestion.ts
// and everything above it only ever sees a GenerateText function (ADR 0003).

import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import type { GenerateText } from './excerptSuggestion';

const DEFAULT_MODEL = 'gemini-3.1-flash-lite';

// Deterministic on purpose: the Playwright suite selects this via AI_PROVIDER
// to exercise the real route/editor path without an AI account. It must never
// be picked implicitly — only an explicit AI_PROVIDER=stub reaches it.
const stubGenerateText: GenerateText = (prompt) => {
  const marker = 'Content:\n';
  const start = prompt.indexOf(marker);
  const content = start === -1 ? prompt : prompt.slice(start + marker.length);
  const normalized = content.replace(/\s+/g, ' ').trim();
  return Promise.resolve(`Stub excerpt suggestion: ${normalized}`);
};

function googleGenerateText(): GenerateText {
  const model = process.env.AI_EXCERPT_MODEL || DEFAULT_MODEL;
  return async (prompt) => {
    const { text } = await generateText({ model: google(model), prompt });
    return text;
  };
}

export function resolveGenerateText(): GenerateText | null {
  if (process.env.AI_PROVIDER === 'stub') {
    return stubGenerateText;
  }
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return googleGenerateText();
  }
  return null;
}

export function excerptSuggestionAvailable(): boolean {
  return resolveGenerateText() !== null;
}
