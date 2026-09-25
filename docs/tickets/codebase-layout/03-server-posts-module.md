# 03 — Posts becomes a module

**Status:** ready-for-agent

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
  ├── index.ts              # exports router; exports what other modules call
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
- `index.ts` exports the router, and the `Post` model only if another module
  still imports it; each such import is listed in this ticket's PR so ticket 18
  can close it.
- `server/src/index.ts` mounts the router from `modules/posts`.
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
