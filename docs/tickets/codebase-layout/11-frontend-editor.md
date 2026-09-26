# 11 — The editor becomes a feature

**Status:** done

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

## Evidence

- Every step of `bun run verify:full` exited 0 on 2026-09-26, run one after
  another: typecheck (frontend, server, harness); lint 0 errors (2
  pre-existing warnings); server tests 237 passed (`--maxWorkers=2`, see
  ticket 07); harness 37 passed; `next build` compiled; Playwright 24 passed,
  including `editor-slash-menu` (4) and `excerpt-suggestion` (1).
- The visual specs are evidence, not comparisons (see ticket 09). Run on their
  own, `editor-frame-visual` and `excerpt-suggestion-visual` passed 5/5 and
  wrote every frame and state to `test-results/`; the split view and the
  filled Excerpt Suggestion were inspected by eye and render as before.
- `index.ts` exports only `PostEditorForm`: the new and edit routes are the
  only callers. `postFormSchema` was cut from `lib/schemas.ts` into
  `features/editor/post-form-schema.ts`; what remains in `lib/schemas.ts` is
  the six unused auth schemas noted in ticket 09.
- `components/editor-rail.tsx` still imports `sidebarNavItems` from
  `@/lib/constants`; ticket 12 moves that list into the Hub feature.
