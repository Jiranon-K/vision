# 10 — Posts becomes a feature

**Status:** done

## Problem Statement

The Post wire contract (`lib/post-contract.ts`), the hooks that fetch and
mutate Posts, the Posts table, the list filters and the Category list live in
five different folders. ADR 0001 records that three copies of this contract
once drifted apart; one folder is the structural half of that fix.

## Solution

Gather it into `src/features/posts/`.

## Implementation Decisions

- In: `lib/post-contract.ts`, `lib/readingTime.ts`, `hooks/usePosts.ts`,
  `components/dashboard/posts/*`, `categories` and `statusFilters` from
  `lib/constants.ts`, and `PostRow` and `DashboardPost` from `types/types.ts`.
- `readingTime` belongs here because both the editor and the blog use it and it
  is a property of a Post, not of either screen.
- `index.ts` exports the contract (`allows`, `PostStatus`, the wire types and
  mappers), the hooks, `PostsTable`, and the Category list. The editor, the
  blog and analytics import these from `@/features/posts`.
- The ESLint `role` restriction message now points at `allows` in
  `@/features/posts`.

## Testing Decisions

- `bun run verify:full` is green; `post-permissions.spec.ts`,
  `publishing.spec.ts` and `hub-data.spec.ts` are the evidence.
- The warn-level rule reports nothing for `features/posts/`.

## Out of Scope

- The editor (ticket 11) and the blog (ticket 15).

## Evidence

- Every step of `bun run verify:full` exited 0 on 2026-09-26, run one after
  another: typecheck (frontend, server, harness); lint 0 errors (2
  pre-existing warnings); server tests 237 passed (`--maxWorkers=2`, see
  ticket 07); harness 37 passed; `next build` compiled; Playwright 24 passed,
  including `post-permissions` (5), `publishing` (1) and `hub-data` (3).
- `next build` compiles with the server-rendered blog importing the Post
  contract from `@/features/posts`, whose index also re-exports `"use client"`
  hooks and components.
- `PostRow` and `DashboardPost` moved from `types/types.ts` to
  `features/posts/types.ts`; `categories` and `statusFilters` moved from
  `lib/constants.ts` to `features/posts/categories.ts`, leaving only the Hub's
  navigation there for ticket 12. The ESLint `role` message now points at
  `allows` in `@/features/posts`.
