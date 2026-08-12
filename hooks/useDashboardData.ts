"use client";

import { useQuery } from "@tanstack/react-query";
import { asWirePage, toDashboardPost } from "@/lib/post-contract";
import { FRESH_FOR, queryFetch, queryKeys } from "@/lib/query";
import { useStats, useViewsTrend } from "@/hooks/useAnalytics";
import type { DashboardPost } from "@/types/types";

const RECENT_POSTS = 4;

// Recent Posts shows four. Asking for one page of that size is the whole
// request, rather than the whole archive sliced down afterwards.
function useRecentPosts(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.postsRecent(RECENT_POSTS),
    queryFn: async () =>
      asWirePage(
        await queryFetch<unknown>(`/api/posts?limit=${RECENT_POSTS}`),
      ).items.map(toDashboardPost),
    staleTime: FRESH_FOR.posts,
    enabled,
  });
}

export function useDashboardData(isAuthed: boolean) {
  // The same two analytics queries the analytics screen uses. Sharing the keys
  // is what makes moving between the two screens cost nothing.
  const stats = useStats(isAuthed);
  const views = useViewsTrend(isAuthed);
  const posts = useRecentPosts(isAuthed);

  const parts = [stats, views, posts];

  return {
    stats: stats.data ?? [],
    viewsData: views.data ?? [],
    posts: (posts.data ?? []) as DashboardPost[],
    isLoading: !isAuthed || parts.some((part) => part.isPending),
    error: parts.some((part) => part.error)
      ? "Failed to fetch dashboard data"
      : null,
    refresh: async () => {
      await Promise.all(parts.map((part) => part.refetch()));
    },
  };
}
