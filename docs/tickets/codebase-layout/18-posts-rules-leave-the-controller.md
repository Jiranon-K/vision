# 18 — The Posts rules leave the controller

**Status:** ready-for-agent

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
