# 08 — What every frontend feature shares becomes `shared/`

**Status:** done

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

## Evidence

- Every step of `bun run verify:full` exited 0 on 2026-09-26, run one after
  another: typecheck (frontend, server, harness); lint 0 errors (2
  pre-existing warnings); server tests 29 files, 237 passed (with
  `--maxWorkers=2`, for the machine-load reason in ticket 07); harness 37
  passed; `next build` compiled; Playwright 24 passed.
- Design sync: `bunx tsc -p .design-sync/tsconfig.dts.json --noEmit` passes
  over `src/shared/ui/`, and `node .design-sync/prepare-css.mjs` compiles the
  CSS from the fresh build. `config.json`, `ds-entry.ts`, `tsconfig.dts.json`
  and `NOTES.md` name `src/shared/ui/`.
- `lib/api.ts` is split: `apiFetch`, `authFetch` and the single-flight refresh
  moved (with history) to `shared/lib/api.ts`; the auth and settings request
  functions stay in `src/lib/api.ts`, importing from it, until tickets 09 and 14. `ErrorResponse` was not moved: nothing imports it.
- **Deviation:** `query.ts` and `query-provider.tsx` sit directly in
  `shared/lib/`, not in a `shared/lib/query/` folder, to avoid
  `@/shared/lib/query/query`.
- **Fixed along the way, missed in ticket 01:** the harness decides whether a
  change needs E2E from `UI_PATHS` in `harness/src/config.ts`, which still
  listed `app/`, `components/`, `hooks/` and `middleware.ts`. After the move
  into `src/` no path matched, so the harness would have skipped E2E for every
  UI change. `UI_PATHS` is now `['src/']`, the harness prompt says so, and
  `harness/tests/gate.test.ts` uses real `src/` paths — its old inputs were
  why the tests did not notice.
