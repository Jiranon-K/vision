# 18 — The Posts rules leave the controller

**Status:** done

## Problem Statement

`modules/posts/posts.controller.ts` is close to six hundred lines. It reads the
request, decides what the actor may do, applies the list filters and search,
assigns and protects the Slug, derives the Excerpt and reading time, and shapes
the response. Every one of those rules can only be exercised by sending HTTP,
and every new route repeats the same parse-authorize-load-save sequence.

## Solution

Extract the rules into `modules/posts/posts.service.ts`, a module with a small
interface that owns them. The controller keeps only what is HTTP: reading the
request, calling the service, writing the response.

## Implementation Decisions

- **The interface** is plain functions that take the actor first:

  ```ts
  listPosts(actor, query); // scope, filters, search, cursor page
  getPost(actor, id);
  createPost(actor, input);
  updatePost(actor, id, input); // Slug stability, Excerpt, reading time
  deletePost(actor, id);
  withholdPost(actor, id, reason);
  restorePost(actor, id);
  ```

  The public blog's reads (`getPublishedBySlug`, and the published list) are
  functions with the Reader as the actor, not a separate module.

- **Errors are thrown** with the helpers in `platform/errors.ts`, which the
  error handler already turns into responses. A `Result` type would change the
  error model of the whole server and is not this ticket.
- **No repository interface over Mongoose.** There is one production adapter,
  and the integration suite already runs it against an in-memory MongoDB; a
  seam with one adapter is hypothetical (ADR 0007).
- **`suggestExcerpt` keeps its `generateText` parameter** (ADR 0003). The
  service calls into the `modules/excerpt-suggestion` entry file and passes it through.
- The policy in `policy.ts` is called by the service, not by the controller.
- Anything `index.ts` exported only so another module could reach a Post model
  directly is replaced by a service function, and the export is removed.

## Testing Decisions

- **Seam:** the service's interface. New tests in
  `modules/posts/posts.service.test.ts` call the functions above against the
  in-memory database from `tests/support/`, with an actor built directly —
  no HTTP. They cover the rules that are currently only reachable through
  requests: scope per actor, Withheld visibility, Slug stability once
  Published, search minimum length, and pagination bounds.
- **The integration suite is not edited.** Every file in
  `tests/integration/` passes unchanged; that is the evidence the extraction
  preserved behaviour.
- `bun run verify:full` is green.
- `posts.controller.ts` contains no Mongoose calls and no policy calls.

## Out of Scope

- The same extraction for auth, analytics or creators. Open a ticket for each
  after this one, if the pattern earned its keep here.
- Any change in behaviour.

## Evidence

- On 2026-09-26, every step of `bun run verify:full` exited 0, run one after
  another: typecheck, typecheck:server, typecheck:harness, lint (0 errors, the
  2 pre-existing warnings), server tests 30 files / 251 passed (237 before plus
  the 14 new ones; run with `--maxWorkers=2` because the machine was under
  load), harness 37 passed, `next build` compiled, Playwright 24 passed.
- `git status` shows no change under `server/tests/integration/`: every
  integration test passes unedited.
- `posts.controller.ts` imports only express types, `AuthRequest` and the
  service; `grep "Post\.|mongoose|authorize|can(|policy"` over it finds nothing.
- `posts.service.test.ts` was checked against four mutations, each restored
  afterwards: letting a Published Slug follow its title (1 test failed),
  dropping the search minimum (5), removing the page-size clamp (2), and
  giving the Reader list an Admin's scope (2).
- **Deviations from the plan:**
  - The functions other modules call — `creatorTotals` (Growth Analytics'
    stats), `publishedPostIds` and `currentExcerpts` (the Excerpt Suggestion
    metrics) — are in `posts.queries.ts`, not the service. The service imports
    the auth and excerpt-suggestion entry files; exporting it from `index.ts`
    would make excerpt-suggestion import itself through Posts and would load
    the session module, which requires `JWT_SECRET`, into every importer of a
    text helper (the failure recorded in ticket 03).
  - `Post` stays exported from `index.ts`, for `migrations/clear-post-author-role.ts`
    and `scripts/backfill-owner.ts`, which rewrite stored documents below the
    rules. A module may no longer import it: a `no-restricted-imports` pattern
    on `../posts` with `importNames: ["Post"]` is an error. A probe file in
    `modules/analytics` importing `Post` and `creatorTotals` from `../posts`
    made `eslint` exit 1 on `Post` only. `IPost`, which nothing outside imported,
    is no longer exported.
  - `createPost` takes the Creator's name as a third argument: the actor
    carries an id, and the name has always come from the session.
  - `getPublishedBySlug`, `listPublishedPosts`, `viewPost` and
    `suggestPostExcerpt` are service functions too. `suggestPostExcerpt`
    returns `undefined` when no provider is configured, so the controller keeps
    the 503 body it always sent.
  - `tests/support/test-db.ts` is new: the in-memory database without the HTTP
    app, for tests that call a module's functions directly.
