# 12 — The Smart Creator Hub's frame becomes a feature

**Status:** done

## Problem Statement

The Hub's frame — the sidebar, the header, the overview cards and the quick
actions — sits in `components/dashboard/` beside folders that belong to other
features, and its navigation is declared in `lib/constants.ts` beside the
Category list.

## Solution

Move it to `src/features/hub/`. `CONTEXT.md` names it the Smart Creator Hub;
the URL stays `/dashboard`.

## Implementation Decisions

- In: `Sidebar`, `DashboardHeader`, `StatsCard`, `QuickActionButton`,
  `RecentPostCard` from `components/dashboard/`, `hooks/useDashboardData.ts`,
  `sidebarNavItems` and `quickActions` from `lib/constants.ts`, and
  `DashboardStat`, `QuickAction` and `NavItem` from `types/types.ts`.
- `lib/constants.ts` is empty after tickets 10 and 12 and is deleted.
- `src/app/dashboard/(shell)/layout.tsx` and `page.tsx` import from
  `@/features/hub`.

## Testing Decisions

- `bun run verify:full` is green; `hub-data.spec.ts` is the evidence.
- The warn-level rule reports nothing for `features/hub/`.

## Out of Scope

- Analytics (ticket 13) and settings (ticket 14), which are rendered inside the
  Hub but are their own features.

## Evidence

- Every step of `bun run verify:full` exited 0 on 2026-09-26, run one after
  another: typecheck (frontend, server, harness); lint 0 errors (2
  pre-existing warnings); server tests 237 passed (`--maxWorkers=2`, see
  ticket 07); harness 37 passed; `next build` compiled; Playwright 24 passed,
  including `hub-data` (3).
- `lib/constants.ts` held only the Hub's navigation after ticket 10, so it
  moved whole to `features/hub/navigation.ts`; `NavItem` and `QuickAction`
  moved to `features/hub/types.ts`. The editor's rail imports
  `sidebarNavItems` from `@/features/hub`.
- **Deviation:** `DashboardStat` did not move here. It is the shape the
  analytics API returns and Analytics' `MetricCard` uses it too; the Hub
  already depends on Analytics (`useDashboardData` calls `useStats` and
  `useViewsTrend`), so ticket 13 moves it into Analytics and the Hub imports
  it from there.
