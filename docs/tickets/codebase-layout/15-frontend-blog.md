# 15 — The blog becomes a feature with a server entry

**Status:** done

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

## Evidence

- Every step of `bun run verify:full` exited 0 on 2026-09-26, run one after
  another: typecheck (frontend, server, harness); lint 0 errors (2
  pre-existing warnings); server tests 237 passed (`--maxWorkers=2`, see
  ticket 07); harness 37 passed; `next build` compiled; Playwright 24 passed,
  including `blog.spec.ts` (2).
- **The server entry holds.** A throwaway `"use client"` component importing
  `getPublishedPosts` from `@/features/blog/server`, rendered from a
  throwaway page, made `bun run build` exit 1 with Turbopack's "You're
  importing a component that needs "server-only"". Both files were deleted
  before the verification run. That build left `.next/types` referring to the
  deleted page, which failed the next `tsc --noEmit` until the generated types
  were removed — worth knowing before repeating the probe.
- `lib/posts.ts` became `features/blog/server.ts` with `import "server-only"`.
  `incrementPostViews` runs in the browser (from `ViewTracker`), so it moved to
  `features/blog/api.ts`, still an uncredentialed `fetch` so how a View is
  counted does not change; its base URL is declared there as well, because a
  client file cannot import `server.ts`.
- `server-only` was added to `dependencies` with bun. `package-lock.json` was
  not updated; it has not changed since the initial commit and `bun.lock` is
  the lockfile CI installs from.
- `BlogPost` moved from `types/types.ts` to `features/blog/types.ts`. The Home
  page's `FeaturedPosts` reads through `@/features/blog/server` and its grid
  renders `BlogCard` from `@/features/blog`.
