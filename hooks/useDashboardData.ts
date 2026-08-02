import { useState, useEffect, useCallback } from "react";
import { authFetch } from "@/lib/api";
import { asWireList, toDashboardPost } from "@/lib/post-contract";
import type { DashboardStat, ViewsDataPoint, DashboardPost } from "@/types/types";

interface DashboardData {
  stats: DashboardStat[];
  posts: DashboardPost[];
  viewsData: ViewsDataPoint[];
  isLoading: boolean;
  error: string | null;
}

export function useDashboardData(isAuthed: boolean) {
  const [data, setData] = useState<DashboardData>({
    stats: [],
    posts: [],
    viewsData: [],
    isLoading: true,
    error: null,
  });

  const fetchDashboardData = useCallback(async () => {
    if (!isAuthed) return;

    setData(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const [statsRes, postsRes, viewsRes] = await Promise.all([
        authFetch("/api/analytics"),
        authFetch("/api/posts"),
        authFetch("/api/analytics/views"),
      ]);

      if (!statsRes.ok || !postsRes.ok || !viewsRes.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const [stats, postsRaw, viewsData] = await Promise.all([
        statsRes.json(),
        postsRes.json(),
        viewsRes.json(),
      ]);

      const normalizedPosts = asWireList(postsRaw).map(toDashboardPost);

      setData({
        stats: stats || [],
        posts: normalizedPosts.slice(0, 4),
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
    fetchDashboardData();
  }, [fetchDashboardData]);

  return { ...data, refresh: fetchDashboardData };
}
