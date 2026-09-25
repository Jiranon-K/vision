# ADR 0004: The server owns the authorization rules, and ships the answers with the resource

Status: Accepted

## Context

Whether a caller may act on a Post depends on their role and on whether they
own it. Today that rule is written twice: once in the API's controllers, and
again in the dashboard components that decide whether to render a button. The
two are kept in step by hand.

The obvious fix — one module both sides import — is not free here. `server/`
is a separate package with its own `tsconfig.json`, its own `node_modules`,
and `rootDir: "./src"`; the root `tsconfig.json` lists `server` under
`exclude`. Sharing a module means either moving the server's `rootDir` (which
relocates everything in `dist/` and the paths the container expects) or
punching a hole in an exclusion that was put there deliberately.

## Decision

The server is the sole author of authorization rules. Endpoints that answer to
a signed-in caller include a `permissions` array alongside each resource,
listing the actions that caller may perform on it. The frontend renders from
that array and never derives a rule of its own; an ESLint rule stops component
code from reading `role` at all.

`permissions` is optional on the wire, following `owner` in the same contract.
Absent means no permissions, not "unknown" — a partially-loaded response must
never be able to reveal a control.

## Considered options

- **A module shared by both packages.** Rejected for the build cost above, and
  because the rules grew richer than the frontend needs to know: an Admin may
  read a Post and Withhold it but not edit it, which is three distinct answers
  the client can consume as three flags without learning why.
- **Duplicate the module and assert equality in a test.** Rejected: it keeps
  two implementations and buys only the detection of drift, not its absence.

## Consequences

Every listing pays a few short strings per Post. The frontend can no longer
answer an authorization question offline, which is the point.
