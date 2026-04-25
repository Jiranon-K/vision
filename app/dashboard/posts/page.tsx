"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { animate } from "animejs";
import PostsHeader from "@/components/dashboard/posts/PostsHeader";
import FilterBar from "@/components/dashboard/posts/FilterBar";
import PostsTable from "@/components/dashboard/posts/PostsTable";
import { useAuth } from "@/hooks/useAuth";
import { usePosts } from "@/hooks/usePosts";
import { toast } from "sonner";
import { PostRowSkeleton } from "@/components/ui/Skeleton";

export default function PostsPage() {
  const { posts, isLoading: isDataLoading, deletePost } = usePosts();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStatus, setActiveStatus] = useState("All");
  const [activeCategory, setActiveCategory] = useState("All");
  const pageRef = useRef<HTMLDivElement>(null);
  const didAnimate = useRef(false);
  const { isLoading: isAuthLoading } = useAuth();

  const showSkeleton = isAuthLoading || (isDataLoading && posts.length === 0);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = activeStatus === "All" || post.status === activeStatus;
      const matchesCategory = activeCategory === "All" || post.category === activeCategory;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [posts, searchQuery, activeStatus, activeCategory]);

  const handleDelete = async (id: string) => {
    const success = await deletePost(id);
    if (success) {
      toast.success("Post deleted successfully");
    } else {
      toast.error("Failed to delete post");
    }
  };

  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !didAnimate.current) {
            didAnimate.current = true;

            animate(".posts-header", {
              opacity: [0, 1],
              translateY: [20, 0],
              duration: 500,
              easing: "easeOutCubic",
            });

            animate(".filter-bar", {
              opacity: [0, 1],
              translateY: [20, 0],
              delay: 100,
              duration: 500,
              easing: "easeOutCubic",
            });

            observer.disconnect();
          }
        });
      },
      { threshold: 0.05 },
    );

    observer.observe(page);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (didAnimate.current) {
      didAnimate.current = false;
      setTimeout(() => {
        didAnimate.current = true;
      }, 50);
    }
  }, [searchQuery, activeStatus, activeCategory]);

  return (
    <div ref={pageRef} className="p-8">
      <div className="posts-header opacity-0">
        <PostsHeader postCount={filteredPosts.length} />
      </div>

      <div className="filter-bar opacity-0">
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeStatus={activeStatus}
          onStatusChange={setActiveStatus}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
      </div>

      {showSkeleton ? (
        <div className="space-y-3">
          {Array(5).fill(0).map((_, i) => <PostRowSkeleton key={i} />)}
        </div>
      ) : (
        <PostsTable posts={filteredPosts} onDelete={handleDelete} />
      )}
    </div>
  );
}
