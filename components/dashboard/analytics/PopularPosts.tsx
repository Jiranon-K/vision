"use client";

import { useMemo } from "react";
import type { DashboardPost } from "@/types/types";

interface PopularPostsProps {
  posts: DashboardPost[];
  limit?: number;
}

export default function PopularPosts({ posts, limit = 5 }: PopularPostsProps) {
  const publishedPosts = useMemo(
    () =>
      posts
        .filter((post) => post.status === "Published")
        .sort((a, b) => b.views - a.views)
        .slice(0, limit),
    [posts, limit]
  );

  return (
    <div className="bg-white rounded-[28px] border-2 border-brand-dark p-6 shadow-[6px_6px_0px_0px_#191A23]">
      <h3 className="text-lg font-bold text-brand-dark mb-6">Popular Posts</h3>
      <div className="space-y-4">
        {publishedPosts.map((post) => (
          <div key={post.id} className="popular-post opacity-0 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-brand-dark truncate">{post.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 bg-brand-lime border border-brand-dark rounded-md text-brand-dark font-medium">
                  {post.category}
                </span>
                <span className="text-xs text-brand-dark/50">{post.views.toLocaleString()} views</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
