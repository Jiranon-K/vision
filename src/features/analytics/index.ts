// The Growth Analytics feature's interface (ADR 0007). Anything not exported
// here is internal to the feature.
export { default as AnalyticsChart } from "./components/analytics-chart";
export { default as MetricCard } from "./components/metric-card";
export { default as PopularPosts } from "./components/popular-posts";
export { default as TrafficSources } from "./components/traffic-sources";
export { useAnalytics, useStats, useViewsTrend } from "./hooks/use-analytics";
export type { DashboardStat, TrafficSource, ViewsDataPoint } from "./types";
