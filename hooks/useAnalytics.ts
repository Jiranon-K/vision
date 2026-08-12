"use client";

import { useQuery } from "@tanstack/react-query";
import { FRESH_FOR, queryFetch, queryKeys } from "@/lib/query";
import type { DashboardStat, ViewsDataPoint } from "@/types/types";

interface AnalyticsData {
  stats: DashboardStat[];
  viewsData: ViewsDataPoint[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// Two queries rather than one fetching both: the dashboard needs the same two,
// and keying them separately is what lets the second screen serve them from
// cache instead of asking again.
export function useStats(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.analyticsStats(),
    queryFn: () => queryFetch<DashboardStat[]>("/api/analytics"),
    staleTime: FRESH_FOR.analytics,
    // Gated on the auth check having passed; without this the queries fire
    // during it and are refused for no reason.
    enabled,
  });
}

export function useViewsTrend(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.analyticsViews(),
    queryFn: () => queryFetch<ViewsDataPoint[]>("/api/analytics/views"),
    staleTime: FRESH_FOR.analytics,
    enabled,
  });
}

export function useAnalytics(isAuthed: boolean): AnalyticsData {
  const stats = useStats(isAuthed);
  const views = useViewsTrend(isAuthed);

  return {
    stats: stats.data ?? [],
    viewsData: views.data ?? [],
    isLoading: !isAuthed || stats.isPending || views.isPending,
    error: stats.error || views.error ? "Failed to fetch analytics data" : null,
    refresh: async () => {
      await Promise.all([stats.refetch(), views.refetch()]);
    },
  };
}
