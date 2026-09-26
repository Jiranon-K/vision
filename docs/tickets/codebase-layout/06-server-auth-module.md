# 06 — Auth becomes a module

**Status:** done

## Problem Statement

Signing in, sessions, email verification and password reset are spread over a
five-hundred-line controller, a routes file, a schema file, two middleware
files and five utilities. `utils/roles.ts` is misnamed: it decides whether a
new account bootstraps the first Admin, and `authz/roles.ts` is the file that
actually defines roles.

## Solution

Gather it into `server/src/modules/auth/`.

## Implementation Decisions

- Layout, kebab-case:

  ```text
  modules/auth/
  ├── index.ts                # exports the `auth` middleware, AuthRequest, Actor
  ├── auth.routes.ts
  ├── auth.controller.ts
  ├── auth.schema.ts
  ├── require-session.ts      # was middleware/auth.ts
  ├── login-security.ts       # was middleware/loginSecurity.ts
  ├── admin-bootstrap.ts      # was utils/roles.ts
  ├── actor.ts                # was authz/actor.ts (split out in ticket 03)
  ├── roles.ts                # was authz/roles.ts
  ├── token.ts
  └── password.ts
  ```

- `models/User.ts` moves here as `user.model.ts`. Other modules that read a
  User import it through `index.ts`; each such import is listed in the PR.
- The `auth` middleware keeps its exported name so every router's import only
  changes path.
- `migrations/renameRole.ts` and `scripts/rename-role.ts` update their imports;
  `migrations/` stays where it is.

## Testing Decisions

- `bun run verify:fast` is green. `auth-email-flow`, `session-revocation`,
  `admin-bootstrap`, `creator-role-contract` and `api-edge` are the evidence.
- The warn-level rule reports nothing for the module.

## Out of Scope

- Splitting the controller into a service. It is worth doing after ticket 18
  proves the pattern on Posts; open a ticket then if it is still wanted.

## Evidence

- `bun run verify:full` exited 0 on 2026-09-26: lint 0 errors (2 pre-existing
  warnings), `npx eslint server/src server/scripts` reports nothing; server
  tests 29 files, 237 passed; harness 37 passed; `next build` compiled;
  Playwright 24 passed.
- `server/src/authz/`, `utils/`, `schemas/`, `models/` and `middleware/` no
  longer exist. Code outside the module imports through
  `modules/auth/index.ts`: the Posts controller and routes, the Analytics
  controller and routes, the settings controller and routes,
  `migrations/renameRole.ts` and `scripts/backfill-owner.ts`.
- **Deviations from the plan:**
  - Importing `modules/auth` loads the token module, which requires
    `JWT_SECRET` at import. The Posts policy only needs the `Actor` type, so it
    uses `import type` and no longer re-exports `READER` and `actorFrom`. Two
    tests change their imports to take those from `modules/auth/actor`:
    `modules/posts/policy.test.ts` and `tests/integration/authz-scope.test.ts`.
    No assertion changed.
  - The ESLint module rules ignore `**/*.test.ts` wherever it sits, not only
    under `server/tests/`, for the reason the exemption already had.
  - `index.ts` also exports `changePasswordSchema`, `profileSchema` and
    `notificationSchema` for the settings routes, until ticket 07 moves them,
    and `reissueSessionAfterPasswordChange`, which the settings controller
    calls after a password change.
