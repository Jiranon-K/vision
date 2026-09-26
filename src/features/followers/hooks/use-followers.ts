"use client";

import { useQuery } from "@tanstack/react-query";
import { authFetch } from "@/shared/lib/api";
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

/** Downloads the Creator's Followers as a CSV file. */
export async function downloadFollowersCsv(): Promise<boolean> {
  const res = await authFetch("/api/followers/export");
  if (!res.ok) return false;
  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = "followers.csv";
  link.click();
  URL.revokeObjectURL(url);
  return true;
}
