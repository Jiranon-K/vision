# 14 — Settings becomes the Creators feature

**Status:** done

## Problem Statement

The settings screen's panels change a Creator's profile, Byline, password and
notification preferences, but live under `components/dashboard/settings/` and
call endpoints declared in the shared `lib/api.ts`.

## Solution

Move them to `src/features/creators/`, matching the server module. The route
stays `/dashboard/settings`.

## Implementation Decisions

- In: `components/dashboard/settings/*`, the profile, password and
  notification `*Request` functions from `lib/api.ts` (into
  `features/creators/api.ts`), and `ChangePasswordRequest` from
  `types/types.ts`.
- After this ticket `lib/api.ts` is empty and deleted; `shared/lib/api.ts` is
  the only generic fetch.
- `components/dashboard/` is empty and deleted.

## Testing Decisions

- `bun run verify:full` is green.
- `src/lib/` and `src/components/dashboard/` no longer exist.
- The warn-level rule reports nothing for `features/creators/`.

## Out of Scope

- Any change to the settings screen.

## Evidence

- Every step of `bun run verify:full` exited 0 on 2026-09-26, run one after
  another: typecheck (frontend, server, harness); lint 0 errors (the 2
  pre-existing warnings, now reported in `features/creators/`); server tests
  237 passed (`--maxWorkers=2`, see ticket 07); harness 37 passed;
  `next build` compiled; Playwright 24 passed.
- After ticket 09, `src/lib/api.ts` held only the settings calls, so it moved
  whole to `features/creators/api.ts` rather than being emptied and deleted.
  `src/lib/api.ts` and `src/components/dashboard/` no longer exist.
- `ChangePasswordRequest` in `types/types.ts` is imported by nothing and was
  left with the other unused auth types noted in ticket 09.
