"use client";

import { useEffect, useRef } from "react";
import { animate, stagger } from "animejs";
import type { PostRow as PostRowType } from "@/types/types";
import type { CurrentUser } from "@/lib/auth";
import PostRow from "./PostRow";

interface PostsTableProps {
  posts: PostRowType[];
  onDelete?: (id: string) => void;
  currentUser?: CurrentUser | null;
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-gray flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand-dark/30">
          <rect x="6" y="8" width="20" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <rect x="6" y="14" width="20" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <rect x="6" y="20" width="12" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-brand-dark mb-2">No posts found</h3>
      <p className="text-brand-dark/50">Try adjusting your search or filter criteria</p>
    </div>
  );
}

export default function PostsTable({ posts, onDelete, currentUser }: PostsTableProps) {
  const tableRef = useRef<HTMLDivElement>(null);
  const didAnimate = useRef(false);

  useEffect(() => {
    const table = tableRef.current;
    if (!table) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !didAnimate.current) {
            didAnimate.current = true;

            animate(".post-row", {
              opacity: [0, 1],
              translateY: [20, 0],
              delay: stagger(60),
              duration: 400,
              easing: "easeOutCubic",
            });

            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 },
    );

    observer.observe(table);
    return () => observer.disconnect();
  }, []);

  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-[20px] border-2 border-brand-dark p-6 shadow-[4px_4px_0px_0px_#191A23]">
        <EmptyState />
      </div>
    );
  }

  return (
    <div ref={tableRef} className="space-y-3">
      {posts.map((post) => (
        <PostRow
          key={post.id}
          post={post}
          onDelete={onDelete}
          canEdit={
            currentUser?.role === "admin" || post.owner === currentUser?.id
          }
        />
      ))}
    </div>
  );
}
