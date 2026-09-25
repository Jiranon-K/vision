# 13 — Analytics becomes a feature

**Status:** ready-for-agent

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
