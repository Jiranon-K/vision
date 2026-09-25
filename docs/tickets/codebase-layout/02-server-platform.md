# 02 — What every server module shares becomes `platform/`

**Status:** done

## Problem Statement

Infrastructure every module uses — the database connection, the logger, the
error helpers, the rate-limit store, email delivery and the request-wide
middleware — sits at the same level as the code that decides what a Creator may
do. Nothing marks it as shared, and nothing stops domain rules from drifting
into it.

## Solution

Move it into `server/src/platform/`, which by ADR 0007 imports no module.

## Implementation Decisions

- Into `platform/`, renamed to kebab-case as it moves:
  - `config/db.ts`, `config/rateLimit.ts`, `config/rateLimitStore.ts`
  - `logger.ts`, `errors.ts`
  - `emails/` (client, send, templates)
  - `middleware/requestId.ts`, `middleware/httpLogger.ts`,
    `middleware/errorHandler.ts`, `middleware/validate.ts`
  - `utils/pagination.ts`, `utils/duplicateKey.ts`, `utils/cookies.ts`
- Stays where it is for now, and moves with its module later:
  `middleware/auth.ts` and `middleware/loginSecurity.ts` (ticket 06), and every
  other `utils/` file.
- `tests/config/rateLimitStore.test.ts` and `tests/emails/send.test.ts` move
  beside their files. `vitest.config.ts` includes `src/**/*.test.ts` as well as
  `tests/**/*.test.ts`; `server/tsconfig.json` and `server/Dockerfile` exclude
  `**/*.test.ts` from the build.
- If anything left in `platform/` imports a model or a module, it does not
  belong in `platform/` — leave it behind and note it in this ticket.

## Testing Decisions

- `bun run verify:fast` is green, including every server integration test.
- The warn-level rule from ticket 01 reports nothing for `server/src/platform/`.
- `docker compose build` succeeds for the API image.

## Out of Scope

- Any module folder.
- Changing what any of these files does.

## Evidence

- `bun run verify:full` exited 0 on 2026-09-26: lint 0 errors (2 pre-existing
  warnings); server tests 29 files, 237 passed — the same count as before, so
  the two tests now beside their files in `platform/` are collected from
  `src/**`; `next build` compiled; Playwright 24 passed.
- `npx eslint server/src` reports nothing, including the rule that `platform/`
  imports no module. Nothing moved into `platform/` imports a model.
- `cd server && bun run build` exited 0 and `dist/` contains no `*.test.*`
  file. `docker compose build` was **not** run: Docker is not installed on the
  machine that made this change.
- Found along the way: the root ESLint config ignores `dist/**` but not
  `server/dist/**`, so a local server build makes `bun run lint` fail on
  compiled output. The build output was deleted before verifying; the ignore
  is not changed here.
