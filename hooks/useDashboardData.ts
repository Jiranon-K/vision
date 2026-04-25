import { useState, useEffect, useCallback } from "react";
import { authFetch } from "@/lib/api";
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

      const postsArr = Array.isArray(postsRaw) ? postsRaw : [];
      const normalizedPosts: DashboardPost[] = postsArr.map((post: any) => ({
        id: post._id,
        title: post.title,
        category: post.category,
        status: post.status,
        date: typeof post.date === 'string' ? post.date : new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        views: post.views,
      }));

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
