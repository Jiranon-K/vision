# 08 — What every frontend feature shares becomes `shared/`

**Status:** ready-for-agent

## Problem Statement

`lib/` holds the credential-carrying fetch next to the Post wire contract next
to password rules; `components/` holds design-system primitives next to the
site's footer. Nothing distinguishes what any feature may use from what belongs
to one.

## Solution

Move the parts no single feature owns into `src/shared/`, renamed to kebab-case.
`shared/` imports no feature.

## Implementation Decisions

| From                                                                         | To                  |
| ---------------------------------------------------------------------------- | ------------------- |
| `components/ui/*` (`ConfirmDialog`, `Icons`, `Skeleton` renamed)             | `shared/ui/`        |
| `lib/api.ts` — `apiFetch`, `authFetch`, the refresh, `ErrorResponse`         | `shared/lib/api.ts` |
| `lib/query.ts`, `components/dashboard/QueryProvider.tsx`                     | `shared/lib/query/` |
| `lib/utils.ts`, `lib/motion.ts`, `lib/site.ts`, `lib/toast.ts`               | `shared/lib/`       |
| `hooks/useMediaQuery.ts`, `hooks/usePrefersReducedMotion.ts`                 | `shared/hooks/`     |
| `components/markdown/*`                                                      | `shared/markdown/`  |
| `Navbar`, `Footer`, `FooterProductLinks`, `SocialLinks`, `AnimationProvider` | `shared/layout/`    |

- `lib/api.ts`'s feature-specific `*Request` functions stay in `lib/api.ts`
  until tickets 09 and 14 move them to their features. Only the generic fetch
  moves now.
- The ESLint `fetch` restriction allows `fetch` in `shared/lib/`,
  `features/*/api.ts`, `features/*/server.ts` and `features/*/hooks/`; it
  forbids it everywhere else under `src/app/` and `src/features/`.
- `.design-sync/config.json` and `.design-sync/previews/` point at `shared/ui/`.
- `docs/design-system.md` updates its paths.

## Testing Decisions

- `bun run verify:full` is green.
- The design-sync build still produces its bundle from the new paths.
- The warn-level rule reports nothing for `shared/`.

## Out of Scope

- Any feature folder.
