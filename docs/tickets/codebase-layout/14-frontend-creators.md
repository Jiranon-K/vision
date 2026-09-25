# 14 — Settings becomes the Creators feature

**Status:** ready-for-agent

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
