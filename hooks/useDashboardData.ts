import { useState, useEffect, useCallback } from "react";
import { authFetch } from "@/lib/api";
import { asWirePage, toDashboardPost } from "@/lib/post-contract";
import type { DashboardStat, ViewsDataPoint, DashboardPost } from "@/types/types";

const RECENT_POSTS = 4;

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
        // Recent Posts shows four. Asking for one page of that size is the
        // whole request, rather than the whole archive sliced down afterwards.
        authFetch(`/api/posts?limit=${RECENT_POSTS}`),
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

      const normalizedPosts = asWirePage(postsRaw).items.map(toDashboardPost);

      setData({
        stats: stats || [],
        posts: normalizedPosts,
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
