# 10 — Posts becomes a feature

**Status:** ready-for-agent

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
