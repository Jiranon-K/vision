"use client";

import { useEffect, useRef } from "react";
import { animate, stagger } from "animejs";
import BlogCard from "@/components/blog/BlogCard";
import type { Post } from "@/lib/posts";

const FeaturedPostsGrid = ({ posts }: { posts: Post[] }) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const didAnimate = useRef(false);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !didAnimate.current) {
            didAnimate.current = true;

            animate(grid.querySelectorAll(".blog-card"), {
              opacity: [0, 1],
              translateY: [40, 0],
              delay: stagger(90),
              duration: 650,
              easing: "easeOutExpo",
            });

            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 },
    );

    observer.observe(grid);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={gridRef}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
    >
      {posts.map((post) => (
        <BlogCard key={post.id} post={post} />
      ))}
    </div>
  );
};

export default FeaturedPostsGrid;
