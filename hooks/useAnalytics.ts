import { useState, useEffect, useCallback } from "react";
import { authFetch } from "@/lib/api";
import type { DashboardStat, ViewsDataPoint } from "@/types/types";

interface AnalyticsData {
  stats: DashboardStat[];
  viewsData: ViewsDataPoint[];
  isLoading: boolean;
  error: string | null;
}

export function useAnalytics(isAuthed: boolean) {
  const [data, setData] = useState<AnalyticsData>({
    stats: [],
    viewsData: [],
    isLoading: true,
    error: null,
  });

  const fetchAnalytics = useCallback(async () => {
    if (!isAuthed) return;

    setData(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const [statsRes, viewsRes] = await Promise.all([
        authFetch("/api/analytics"),
        authFetch("/api/analytics/views"),
      ]);

      if (!statsRes.ok || !viewsRes.ok) {
        throw new Error("Failed to fetch analytics data");
      }

      const [stats, viewsData] = await Promise.all([
        statsRes.json(),
        viewsRes.json(),
      ]);

      setData({
        stats: stats || [],
        viewsData: viewsData || [],
        isLoading: false,
        error: null,
      });
    } catch (err) {
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : "An error occurred",
      }));
    }
  }, [isAuthed]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { ...data, refresh: fetchAnalytics };
}
