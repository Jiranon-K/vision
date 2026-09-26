# 09 — Auth becomes a feature

**Status:** done

## Problem Statement

Signing in, registering, resetting a password and verifying an email use code
from `components/auth/`, four hooks in `hooks/`, five files in `lib/`, and the
request types in `types/types.ts`.

## Solution

Gather it into `src/features/auth/`, entered through `index.ts`.

## Implementation Decisions

- In: `components/auth/*`, `components/dashboard/UnverifiedEmailBanner.tsx`,
  `hooks/useAuth.ts`, `useRedirectIfAuthenticated.ts`, `useFieldErrors.ts`,
  `usePasswordToggle.tsx`, `lib/auth.ts`, `lib/auth-validation.ts`,
  `lib/password.ts`, `lib/schemas.ts`, the auth `*Request` functions from
  `lib/api.ts` (into `features/auth/api.ts`), and `AuthUser` and the auth
  request and response types from `types/types.ts` (into `types.ts`).
- Inside, `components/` and `hooks/` subfolders; files kebab-case.
- `index.ts` exports what `src/app/` and other features use — and nothing they
  do not.
- `src/app/login`, `register`, `forgot-password`, `reset-password`,
  `verify-email` and the Hub layout import from `@/features/auth`.

## Testing Decisions

- `bun run verify:full` is green; `auth.spec.ts` and `auth-visual.spec.ts` are
  the evidence and must pass without updated snapshots.
- The warn-level rule reports nothing for `features/auth/`.

## Out of Scope

- Any change to how auth behaves or looks.

## Evidence

- Every step of `bun run verify:full` exited 0 on 2026-09-26, run one after
  another: typecheck (frontend, server, harness); lint 0 errors (2
  pre-existing warnings), nothing under `src/features/auth/`; server tests 237
  passed (`--maxWorkers=2`, see ticket 07); harness 37 passed; `next build`
  compiled; Playwright 24 passed, including the 4 cases of `auth.spec.ts`.
- `auth-visual.spec.ts` is not in the default E2E project, and it compares
  nothing: it writes screenshots to `test-results/auth-visual/` as evidence.
  Run alone with
  `bunx playwright test --project=screenshots e2e/auth-visual.spec.ts`, it
  passed 3/3 and wrote every auth screen and state; register's strength meter
  and login's credential error were inspected by eye and render as before.
  "Without updated snapshots" in this ticket assumed baselines that do not
  exist.
- The six auth endpoint calls moved from `src/lib/api.ts` to
  `features/auth/api.ts`; `src/lib/api.ts` now holds only the settings calls.
- **Deviations:** `lib/schemas.ts` did not move here. Its six auth schemas are
  imported by nothing; the one schema in use, `postFormSchema`, belongs to the
  editor (ticket 11). Likewise the auth request and response types in
  `types/types.ts` (`AuthUser`, `LoginRequest`, …) are imported by nothing and
  were left for ticket 16 rather than moved. Whether to delete them is a
  separate decision.
