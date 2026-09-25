# ADR 0007: Code is organised by feature, and each feature is entered through one file

Status: Accepted

## Context

Both halves of the repository are organised by kind of file. The frontend has
`components/`, `hooks/`, `lib/` and `types/`; the server has `routes/`,
`controllers/`, `models/`, `schemas/` and `utils/`.

That layout scatters every change. Changing how a Post behaves touches eight
server folders — the route, the controller, the schema, the model, the policy
and three utilities — and on the frontend a hook, a wire contract, a
server-side fetcher, a shared types file and two component folders. Knowledge
about one thing lives in many places, and nothing says which of them a caller
may depend on.

The server's controllers are also where the rules live. `posts.controller.ts`
is close to six hundred lines that mix parsing a request with deciding what a
Creator may do, so every rule can only be exercised through HTTP.

## Decision

**Folders are named for the domain, from `CONTEXT.md`.** A screen is a route in
`src/app/`; a feature is a noun the product is built around. The same noun
names the frontend feature and the server module, so `posts` means the same
thing on both sides.

```text
src/                         server/src/
├── app/        routes only  ├── modules/
├── features/                │   ├── posts/
│   ├── auth/                │   ├── auth/
│   ├── posts/               │   ├── creators/
│   ├── editor/              │   ├── analytics/
│   ├── blog/                │   └── excerpt-suggestion/
│   ├── hub/                 ├── platform/   db, logger, errors, rate limits,
│   ├── analytics/           │               email, cross-cutting middleware
│   ├── creators/            └── index.ts
│   └── marketing/
└── shared/     ui, lib, hooks, markdown, layout
```

Three names are not literal glossary nouns and are deliberate: `editor` is the
Creator's writing surface, `blog` is the Reader's side of Posts, and `hub` is
the Smart Creator Hub's frame. Settings becomes `creators`, because a profile,
a Byline and notification preferences belong to a Creator; "settings" is only
the name of a screen. A View belongs to `analytics`, not to `posts`: it is a
fact about reading, not a property of a Post.

**Each feature is entered through one file.** A frontend feature exposes
`index.ts`; a feature with code that must only run on the server also exposes
`server.ts`, which imports `server-only`. A server module's `index.ts` exposes
only the functions and types another module actually calls; its router is a
second entry, `x.routes.ts`, which only `server/src/index.ts` imports to mount
it. Anything not exported from an entry file is internal, and nothing outside
the feature imports it.

The router is kept out of `index.ts` because a router drags in the session
middleware, the rate limiters and everything they read at import time. A module
that only wanted a helper from Posts would pay for all of it, and two modules
whose routers use each other's helpers would import in a circle. (Amended during
ticket 03, when putting the router in `index.ts` did both.)

**Imports run one way.** `app → features → shared` on the frontend,
`index.ts → modules → platform` on the server. `shared/` and `platform/` never
import a feature. Per ADR 0001, both rules live in `eslint.config.mjs` as
`no-restricted-imports`, not in prose.

**Files are kebab-case**, everywhere, enforced by lint. It removes the class of
bug where a rename that differs only in case works on Windows and fails in the
Linux build.

**Unit tests sit beside the file they test.** Integration tests, which cross
modules through HTTP, stay in `server/tests/integration/`.

**Moving and changing are separate.** A move is `git mv` plus import rewrites
and nothing else, so that it can be accepted on a green `verify:full` alone.
Extracting the Posts rules out of the controller into `posts.service.ts` is its
own change, made after the moves.

## Consequences

A change to one feature is found in one folder on each side, and an entry file
states what the rest of the codebase depends on — which is what makes the
inside of a feature safe to rework.

Some imports get longer or more deliberate. The Home page's featured Posts now
come from `@/features/blog/server`; that is an import across features through
an interface, and it is allowed.

Rules that a feature does not own go to `shared/` or `platform/` only when a
second feature needs them. Excerpt Suggestion stays inside `editor` on the
frontend because nothing else calls it; it becomes a feature when something
does.

A monorepo with a shared contract package is not part of this decision. The two
halves still share nothing but HTTP (see `docs/architecture.md`); that is worth
revisiting when a second client exists.

The migration is sequenced in `docs/tickets/codebase-layout/`.
