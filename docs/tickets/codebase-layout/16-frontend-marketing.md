# 16 — Marketing becomes a feature, and `types/` goes

**Status:** done

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

## Evidence

- Every step of `bun run verify:full` exited 0 on 2026-09-26, run one after
  another, after both commits: typecheck (frontend, server, harness); lint 0
  errors (2 pre-existing warnings); server tests 237 passed (`--maxWorkers=2`,
  see ticket 07); harness 37 passed; `next build` compiled; Playwright 24
  passed, including `marketing.spec.ts` (3).
- The featured-Posts section fetches while it renders, so marketing has a
  `server.ts` (with `server-only`) that exports it; every other section is
  exported from `index.ts`. The two `Hero` components are exported as
  `PricingHero` and `ServicesHero`; the pages import them under their old
  local names, so no JSX changed.
- **Deleted, decided with the owner:** `src/types/types.ts` (by then only
  `AuthUser`, the auth request and response types, and `ErrorResponse`) and
  `src/lib/schemas.ts` (six auth zod schemas). Nothing imported either. The
  deletion is its own commit.
- `src/` now contains `app/`, `features/`, `shared/` and `middleware.ts` only.
- Still unused and not deleted, because the decision above covered only those
  two files: `EngagementData` in `features/analytics/types.ts`, and the server's
  `modules/analytics/analytics.model.ts` (ticket 04).
- Found along the way: the frontend imports `zod` without declaring it; it
  resolves only through `eslint-plugin-react-hooks`, a dev dependency. Raised
  as a separate task.
