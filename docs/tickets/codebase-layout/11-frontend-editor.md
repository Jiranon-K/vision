# 11 — The editor becomes a feature

**Status:** ready-for-agent

## Problem Statement

The editor is the largest body of frontend code — some twenty-five files in
`components/dashboard/editor/` plus `hooks/useAutosaveDraft.ts` — nested under a
folder named for a different screen.

## Solution

Move it to `src/features/editor/`. Excerpt Suggestion's frontend stays inside
it: only the editor uses it (ADR 0007).

## Implementation Decisions

- In: `components/dashboard/editor/*`, `hooks/useAutosaveDraft.ts`.
- Inside: `components/`, `hooks/`, and the pure modules (`markdown-ops.ts`,
  `caret-coordinates.ts`, `types.ts`) at the feature root.
- `index.ts` exports `PostEditorForm` and whatever the two editor routes under
  `src/app/dashboard/posts/` need, nothing more.
- The editor imports the Post contract from `@/features/posts` and the preview
  renderer from `@/shared/markdown`.

## Testing Decisions

- `bun run verify:full` is green; `editor-frame-visual`, `editor-slash-menu`,
  `excerpt-suggestion` and `excerpt-suggestion-visual` are the evidence and must
  pass without updated snapshots.
- The warn-level rule reports nothing for `features/editor/`.

## Out of Scope

- Any change to the editor's behaviour.
