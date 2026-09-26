// The Smart Creator Hub's frame (ADR 0007): its navigation, header and
// overview. The screens inside it belong to their own features.
export { default as DashboardHeader } from "./components/dashboard-header";
export { default as QuickActionButton } from "./components/quick-action-button";
export { default as RecentPostCard } from "./components/recent-post-card";
export { default as Sidebar } from "./components/sidebar";
export { default as StatsCard } from "./components/stats-card";
export { useDashboardData } from "./hooks/use-dashboard-data";
export { quickActions, sidebarNavItems } from "./navigation";
export type { NavItem, QuickAction } from "./types";
