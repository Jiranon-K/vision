# 13 — Analytics becomes a feature

**Status:** done

## Problem Statement

Growth Analytics' screen is split between `components/dashboard/AnalyticsChart.tsx`,
`components/dashboard/analytics/`, `hooks/useAnalytics.ts` and three types in
`types/types.ts`.

## Solution

Gather it into `src/features/analytics/`, matching the server module of the same
name.

## Implementation Decisions

- In: `AnalyticsChart.tsx`, `components/dashboard/analytics/*`,
  `hooks/useAnalytics.ts`, and `ViewsDataPoint`, `TrafficSource` and
  `EngagementData` from `types/types.ts`.
- If the Hub overview uses the chart, it imports it from `@/features/analytics`.

## Testing Decisions

- `bun run verify:full` is green; the analytics cases in `hub-data.spec.ts` are
  the evidence.
- The warn-level rule reports nothing for `features/analytics/`.

## Out of Scope

- Any change to what analytics shows.

## Evidence

- Every step of `bun run verify:full` exited 0 on 2026-09-26, run one after
  another: typecheck (frontend, server, harness); lint 0 errors (2
  pre-existing warnings); server tests 237 passed (`--maxWorkers=2`, see
  ticket 07); harness 37 passed; `next build` compiled; Playwright 24 passed,
  including `hub-data` (3).
- `DashboardStat`, `ViewsDataPoint`, `TrafficSource` and `EngagementData`
  moved to `features/analytics/types.ts`; the Hub's `stats-card` and
  `use-dashboard-data` import from `@/features/analytics`. `src/hooks/` no
  longer exists.
- The Hub overview and the analytics page load the chart with
  `dynamic(() => import("@/features/analytics").then((m) => m.AnalyticsChart))`.
  Both pages also import the feature statically, so the chart's own code no
  longer gets a separate chunk. Its one heavy dependency, `animejs`, was
  already in every page through `AnimationProvider`, so the cost is the
  component's own code. The loading skeleton still renders while it mounts.
- `EngagementData` is imported by nothing; it moved with its siblings and is
  not exported from `index.ts`.
