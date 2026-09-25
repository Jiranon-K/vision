# 05 — Excerpt Suggestion becomes a module

**Status:** ready-for-agent

## Problem Statement

Excerpt Suggestion lives in three places: `ai/` (the suggestion and the
provider seam from ADR 0003), `reporting/` (the usage record and the metrics),
and `models/ExcerptSuggestion.ts`. ADR 0002 depends on the save and publish
path never reaching the provider; that is easier to see when everything that
can reach it is in one folder.

## Solution

Gather it into `server/src/modules/excerpt-suggestion/`.

## Implementation Decisions

- Layout, kebab-case:

  ```text
  modules/excerpt-suggestion/
  ├── index.ts                     # exports suggestExcerpt, resolveGenerateText,
  │                                #   recordExcerptSuggestion, claimOrphanSuggestion
  ├── suggest-excerpt.ts           # was ai/excerptSuggestion.ts
  ├── suggest-excerpt.test.ts
  ├── provider.ts                  # was ai/provider.ts
  ├── excerpt-suggestion.model.ts
  ├── record.ts                    # was reporting/excerptSuggestionRecord.ts
  └── metrics.ts                   # was reporting/excerptSuggestionMetrics.ts
  ```

- The suggest-excerpt route stays mounted under `/api/posts`; its handler in the
  Posts module imports from the `modules/excerpt-suggestion` entry file. `suggestExcerpt`
  keeps taking `generateText` as a parameter — that seam has two adapters
  (the provider and the tests) and is real.
- `scripts/excerpt-suggestion-metrics.ts` updates its import.

## Testing Decisions

- `bun run verify:fast` is green, including `save-path-provider-free`, which
  is the ADR 0002 guarantee and must pass unedited.
- The warn-level rule reports nothing for the module.

## Out of Scope

- Any change to the suggestion, its prompt, or its metrics.
