# 15 — The blog becomes a feature with a server entry

**Status:** ready-for-agent

## Problem Statement

The Reader's side of Posts renders on the server: `lib/posts.ts` fetches
Published Posts during render and is imported by the blog pages, the sitemap
and the Home page. Nothing prevents a client component from importing it, and
if one did through a shared entry file, server-only code would be pulled into
the browser bundle.

## Solution

Move the blog into `src/features/blog/` with two entry files: `index.ts` for
what a client may use, and `server.ts` for what must only run during a server
render. `server.ts` imports `server-only`, so a client import of it fails the
build.

## Implementation Decisions

- In: `components/blog/*` and `lib/posts.ts`.
- `server.ts` exports `getPublishedPosts`, `getPostBySlug`, `isMovedPost` and
  the `MovedPost` type. `lib/posts.ts`'s view-increment function is removed if
  `ViewTracker` already posts through the client fetch; otherwise it moves to
  `features/blog/api.ts`, since `ViewTracker` runs in the browser. Say which in
  the PR.
- `index.ts` exports the components the blog routes render.
- Add `server-only` as a dependency.
- `src/app/blog/*` and `src/app/sitemap.ts` import from `@/features/blog/server`.

## Testing Decisions

- `bun run verify:full` is green; `blog.spec.ts` is the evidence.
- Deliberately importing `@/features/blog/server` from a `"use client"` file
  fails `bun run build`. Confirm once by hand and record the error in the PR;
  do not commit the failing import.
- The warn-level rule reports nothing for `features/blog/`.

## Out of Scope

- Marketing's featured Posts (ticket 16).
