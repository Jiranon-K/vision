# 06 — Auth becomes a module

**Status:** ready-for-agent

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
  ├── index.ts                # exports router, the `auth` middleware, AuthRequest
  ├── auth.routes.ts
  ├── auth.controller.ts
  ├── auth.schema.ts
  ├── require-session.ts      # was middleware/auth.ts
  ├── login-security.ts       # was middleware/loginSecurity.ts
  ├── admin-bootstrap.ts      # was utils/roles.ts
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
