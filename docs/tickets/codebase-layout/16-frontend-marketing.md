# 16 — Marketing becomes a feature, and `types/` goes

**Status:** ready-for-agent

## Problem Statement

The public marketing pages are built from `components/Home/`,
`components/pricing/`, `components/services/` and the content files in
`components/data/`. `Home/` is the only capitalised folder in the tree. After
tickets 09–15, `types/types.ts` holds only what is left over.

## Solution

Gather marketing into `src/features/marketing/`, and remove `types/`.

## Implementation Decisions

- In: `components/Home/*` (into `components/home/`), `components/pricing/*`,
  `components/services/*`, and `components/data/*` (into `content/`).
- `FeaturedPosts` fetches through `@/features/blog/server`; marketing gets a
  `server.ts` only if it exports something that must run on the server itself.
- `BlogPost` and any type left in `types/types.ts` move to the feature that
  uses it; `types/` is deleted.
- After this ticket `src/components/`, `src/hooks/`, `src/lib/` and
  `src/types/` no longer exist. `src/` contains `app/`, `features/`, `shared/`
  and `middleware.ts`.

## Testing Decisions

- `bun run verify:full` is green; `marketing.spec.ts` is the evidence.
- The warn-level rule reports nothing under `src/`.

## Out of Scope

- Any change to marketing copy or layout.
