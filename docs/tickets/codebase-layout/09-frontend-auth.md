# 09 — Auth becomes a feature

**Status:** ready-for-agent

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
