# 04 — Analytics becomes a module, and owns the View

**Status:** done

## Problem Statement

What a View is — the dedupe window, crawler detection, reader identity, the
per-day rollup — is split between the Posts controller and the analytics
controller. A View is a fact about reading and is what analytics reports, yet
the rules for recording one live beside the rules for editing a Post.

## Solution

Move analytics into `server/src/modules/analytics/` and bring the View with it.
The route `POST /api/posts/:id/view` keeps its URL; its handler in Posts calls
`recordView` from the `modules/analytics` entry file.

## Implementation Decisions

- Layout, kebab-case:

  ```text
  modules/analytics/
  ├── index.ts                  # exports recordView
  ├── analytics.routes.ts
  ├── analytics.controller.ts
  ├── analytics.model.ts
  ├── post-view.model.ts
  ├── view-record.model.ts
  ├── reader-identity.ts
  └── record-view.ts            # the View logic lifted out of posts.controller
  ```

- `recordView` is the one function this ticket writes rather than moves: the
  existing View code is cut from the Posts controller into it unchanged, with
  the request details it needs passed in. The Posts handler parses the request
  and calls it. This is the minimum needed for the View to have one owner.
- The URL, request and response of every analytics and View route are
  unchanged.

## Testing Decisions

- `bun run verify:fast` is green. `view-integrity` and `analytics` integration
  tests are the evidence; they must pass without edits beyond import paths.
- The warn-level rule reports no import from `modules/posts/` into analytics
  internals or back.

## Out of Scope

- Changing what counts as a View.
- The Posts service (ticket 18).

## Evidence

- `bun run verify:full` exited 0 on 2026-09-26: lint 0 errors (2 pre-existing
  warnings), `npx eslint server/src server/scripts` reports nothing; server
  tests 29 files, 237 passed with no test edited beyond one import path in
  `view-integrity.test.ts`; harness 37 passed; `next build` compiled;
  Playwright 24 passed.
- `recordView(post, req)` returns whether a new View was counted; the Posts
  handler moves `Post.views` only when it was. `forgetViews(postId)` replaces
  the two rollup deletes in the Posts delete handler. The one change in order:
  the daily rollup is now written before `Post.views` is incremented rather
  than after. Neither write was in a transaction before, so no reader could
  depend on the order.
- `analytics.model.ts` (was `models/Analytics.ts`) is imported by nothing in
  `server/`. It moved as planned and was not deleted; whether it is dead is a
  separate decision.
- The Analytics controller reads Posts through `modules/posts` (`Post`), which
  is in ticket 03's list for ticket 18.
