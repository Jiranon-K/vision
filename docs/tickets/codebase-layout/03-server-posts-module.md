# 03 — Posts becomes a module

**Status:** done

## Problem Statement

Everything that decides how a Post behaves is spread over eight server folders:
`routes/posts.ts`, `controllers/posts.controller.ts`, `schemas/posts.ts`,
`models/Post.ts`, `authz/postPolicy.ts`, `utils/slug.ts`,
`utils/postContent.ts`, and the search helpers inside the controller. A change
to Posts starts with finding them.

## Solution

Gather them into `server/src/modules/posts/`, entered through `index.ts`.

## Implementation Decisions

- Layout, kebab-case:

  ```text
  modules/posts/
  ├── index.ts              # exports what other modules call (not the router)
  ├── posts.routes.ts
  ├── posts.controller.ts
  ├── posts.schema.ts
  ├── post.model.ts
  ├── policy.ts             # was authz/postPolicy.ts
  ├── policy.test.ts        # was tests/authz/postPolicy.test.ts
  ├── slug.ts
  ├── content.ts            # was utils/postContent.ts
  └── content.test.ts
  ```

- `authz/roles.ts` is used by the policy and by auth. It moves to
  `platform/roles.ts` if auth needs it too, otherwise into this module; decide by
  its importers at the time.
- The controller is moved, not split. Extracting a service is ticket 18.
- The View route's handler, `PostView`, `ViewRecord` and `readerIdentity` stay
  where they are until ticket 04 moves them to Analytics.
- `index.ts` exports the `Post` model only because other code still imports
  it; each such import is listed in this ticket's evidence so ticket 18 can
  close it. It does not export the router (see ADR 0007).
- `server/src/index.ts` mounts the router from `modules/posts/posts.routes`.
- `scripts/backfill-owner.ts` and `scripts/clear-post-author-role.ts` update
  their imports.

## Testing Decisions

- `bun run verify:fast` is green. The integration suite for Posts
  (`posts-authz`, `posts-pagination`, `posts-search`, `post-slug`,
  `post-permissions`, `withheld`, `byline`) is the evidence that nothing moved
  in behaviour.
- The warn-level rule reports nothing for `modules/posts/`.

## Out of Scope

- `posts.service.ts` (ticket 18).
- Views (ticket 04) and Excerpt Suggestion (ticket 05).

## Evidence

- `bun run verify:full` exited 0 on 2026-09-26: lint 0 errors (2 pre-existing
  warnings), `npx eslint server/src server/scripts` reports nothing; server
  tests 29 files, 237 passed; harness 37 passed; `next build` compiled;
  Playwright 24 passed.
- **Two deviations from the plan, both forced by import cycles:**
  - `Actor`, `READER` and `actorFrom` were cut from the policy into
    `server/src/authz/actor.ts`, unchanged. The session middleware builds an
    Actor and the Posts router uses that middleware; with Actor inside Posts
    the two imported each other. `policy.ts` re-exports them, so its callers
    and tests did not change. Ticket 06 moves `actor.ts` into auth.
  - The router is not exported from `index.ts`; `server/src/index.ts` mounts
    `modules/posts/posts.routes`. With the router in `index.ts`, importing a
    text helper from Posts loaded the session middleware, whose token module
    requires `JWT_SECRET` at import: `tests/ai/excerptSuggestion.test.ts` and
    `excerpt-suggestion-metrics.test.ts` failed with `JWT_SECRET is required`.
    ADR 0007 and the ESLint module rule are amended to allow `x.routes` as a
    module's second entry.
- `authz/roles.ts` stays until ticket 06: its importers are the User model, the
  token module and the auth controller, none of them Posts.
- Code outside the module still importing the `Post` model through `index.ts`,
  for ticket 18: `controllers/analytics.controller.ts`,
  `reporting/excerptSuggestionMetrics.ts`, `migrations/clearPostAuthorRole.ts`,
  `scripts/backfill-owner.ts`; and `syncCreatorByline` from
  `controllers/settings.controller.ts`.
