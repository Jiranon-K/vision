# 07 — Settings becomes the Creators module

**Status:** ready-for-agent

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
  ├── index.ts                 # exports router
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
