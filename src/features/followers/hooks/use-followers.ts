"use client";

import { useQuery } from "@tanstack/react-query";
import { FRESH_FOR, queryFetch, queryKeys } from "@/shared/lib/query";
import type { FollowerFigures, FollowerRow, FollowerSummary } from "../types";

export function useFollowers(enabled = true) {
  return useQuery({
    queryKey: queryKeys.followersList(),
    queryFn: async () => (await queryFetch<{ items: FollowerRow[] }>("/api/followers")).items,
    staleTime: FRESH_FOR.analytics,
    enabled,
  });
}

export function useFollowerSummary(enabled = true) {
  return useQuery({
    queryKey: queryKeys.followersSummary(),
    queryFn: () => queryFetch<FollowerSummary>("/api/followers/summary"),
    staleTime: FRESH_FOR.analytics,
    enabled,
  });
}

export function useFollowerFigures(enabled = true) {
  return useQuery({
    queryKey: queryKeys.analyticsFollowers(),
    queryFn: () => queryFetch<FollowerFigures>("/api/analytics/followers"),
    staleTime: FRESH_FOR.analytics,
    enabled,
  });
}
