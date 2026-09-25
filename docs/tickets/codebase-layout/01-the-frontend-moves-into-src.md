# 01 — The frontend moves into `src/`, and the layout rules start warning

**Status:** ready-for-agent

## Problem Statement

The repository root holds the frontend's source folders beside three other
deployables and their tooling: `server/`, `harness/`, `e2e/`, `docs/`, and a
dozen config files. A newcomer cannot tell from the root which folders are one
application. There is also no mechanical check yet for the layout ADR 0007
describes, so every later ticket would be measured by eye.

## Solution

Move the frontend source under `src/` exactly as it is, and point the `@/*`
alias there. Because the alias moves with the folders, no import changes:
`@/components/ui/button` resolves to `src/components/ui/button` afterwards.

Add the layout rules from ADR 0007 at warning level, so every later ticket can
watch its warning count go to zero for the folders it moves.

## Implementation Decisions

- `git mv` `app/`, `components/`, `hooks/`, `lib/`, `types/` and
  `middleware.ts` into `src/`. Create empty `src/features/` and `src/shared/`
  (with a `.gitkeep`) so the target shape is visible.
- `public/`, `next.config.ts`, `postcss.config.mjs`, `playwright.config.ts`,
  `eslint.config.mjs` and `tsconfig.json` stay at the root; Next.js looks for
  them there.
- `tsconfig.json`: `"@/*": ["./src/*"]`.
- Paths that name the old folders are updated to their new location, and
  nothing else is changed in them:
  - `eslint.config.mjs` — the existing `fetch` and `role` restriction applies to
    `src/app/**` and `src/components/**`.
  - `package.json` `lint-staged` globs.
  - `.design-sync/config.json` and anything else under `.design-sync/` that
    names `components/ui/`.
  - `docs/architecture.md` — the repository layout block.
- **New rules, at `warn`:**
  - `no-restricted-imports` for `src/**`: no import of `@/features/*/*` except
    `@/features/*/server`; nothing under `src/shared/**` imports
    `@/features/**`.
  - `no-restricted-imports` for `server/src/**`: no import reaching into
    `modules/*/` except that module's `index`; nothing under `platform/`
    imports `modules/`.
  - A kebab-case file name check for `src/**` and `server/src/**`, written as a
    small local rule beside the two in ADR 0001 — no plugin.
- These rules find nothing yet because the target folders are empty; they
  exist so tickets 02–16 are checked as they land.

## Testing Decisions

A move is verified by the checks that already exist.

- `bun run verify:full` is green: typecheck, lint, server tests, harness
  tests, production build, and the browser suite.
- `bun run build` produces the standalone output and `middleware.ts` still
  gates `/dashboard/*` — the browser suite's signed-out redirect case covers it.
- `docker build .` succeeds; the Dockerfile copies the whole context, so it
  should need no change, and this confirms it.

## Out of Scope

- Moving anything into `features/` or `shared/`.
- Renaming files to kebab-case.
- The server.
