# 07 — Settings becomes the Creators module

**Status:** done

## Problem Statement

`settings` names a screen, not a thing. What the settings routes change — a
profile, a Byline, a password, notification preferences — belongs to a
Creator, and `CONTEXT.md` calls that person a Creator.

## Solution

Move settings into `server/src/modules/creators/`. The URLs under
`/api/settings` do not change; renaming a module is not a reason to break a
contract.

## Implementation Decisions

- Layout, kebab-case:

  ```text
  modules/creators/
  ├── index.ts                 # exports what other modules call
  ├── creators.routes.ts       # still mounted at /api/settings
  ├── creators.controller.ts
  └── creators.schema.ts
  ```

- The capabilities route and controller move here too if they describe what the
  signed-in Creator may do; if they describe Posts, they go to `modules/posts`.
  Decide by reading them and say which in the PR.
- After this ticket, `routes/`, `controllers/`, `models/`, `schemas/`,
  `utils/`, `authz/`, `ai/`, `reporting/` and `middleware/` under
  `server/src/` are empty and deleted. Anything still in them is listed and
  placed before merging.

## Testing Decisions

- `bun run verify:fast` is green; `capabilities` and the settings cases in the
  integration suite are the evidence.
- `server/src/` contains only `index.ts`, `platform/`, `modules/` and
  `migrations/`.

## Out of Scope

- Changing any `/api/settings` URL.

## Evidence

- Every step of `bun run verify:full` exited 0 on 2026-09-26, run one after
  another: frontend, server and harness typecheck; lint 0 errors (2
  pre-existing warnings) and nothing under `server/`; server tests 29 files,
  237 passed; harness 37 passed; `next build` compiled; Playwright 24 passed.
  The server tests ran with `bunx vitest run --maxWorkers=2` rather than
  `bun run test`: with default parallelism, two runs failed 13–18 suites with
  `MongoMemoryServer ... failed to start within 10000ms` while another
  application on the machine held ~17 GB of memory and the CPU was at 88%.
  The failures were all in database start-up, none in an assertion.
- The capabilities route and controller describe which optional features the
  server has on — today only Excerpt Suggestion — so they moved to
  `modules/excerpt-suggestion/` (`capabilities.routes.ts`, still mounted at
  `/api/capabilities`), neither to Creators nor to Posts. Decided with the
  owner.
- `changePasswordSchema`, `profileSchema` and `notificationSchema` moved from
  `auth.schema.ts` to `creators.schema.ts`; auth exports `passwordSchema` so
  both password rules stay one rule.
- Creators has no `index.ts`: no other module calls into it. It gets one when
  something does.
- `server/src/` contains only `index.ts`, `platform/`, `modules/` and
  `migrations/`. `docs/architecture.md` describes the server as modules and
  platform.
