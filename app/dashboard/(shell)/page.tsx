"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { animate, stagger } from "animejs";
import dynamic from "next/dynamic";
import StatsCard from "@/components/dashboard/StatsCard";
import RecentPostCard from "@/components/dashboard/RecentPostCard";
import QuickActionButton from "@/components/dashboard/QuickActionButton";
import { quickActions } from "@/lib/constants";
import { useDashboardData } from "@/hooks/useDashboardData";
import { StatsCardSkeleton, RecentPostSkeleton } from "@/components/ui/Skeleton";

const AnalyticsChart = dynamic(() => import("@/components/dashboard/AnalyticsChart"), {
  loading: () => <div className="bg-white rounded-[28px] border-2 border-brand-dark p-8 h-[280px] animate-pulse" />,
});

export default function DashboardPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const didAnimate = useRef(false);
  const { isLoading: isAuthLoading, isAuthed } = useAuth();
  const { stats, posts, viewsData, isLoading: isDataLoading } = useDashboardData(isAuthed);

  const showSkeleton = isAuthLoading || isDataLoading;

  useEffect(() => {
    if (!isAuthed || showSkeleton) return;

    const page = pageRef.current;
    if (!page) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !didAnimate.current) {
            didAnimate.current = true;

            animate(".stats-card", {
              opacity: [0, 1],
              translateY: [20, 0],
              delay: stagger(80, { start: 200 }),
              duration: 600,
              easing: "easeOutCubic",
            });

            animate(".quick-action", {
              opacity: [0, 1],
              scale: [0.9, 1],
              delay: stagger(100, { start: 500 }),
              duration: 500,
              easing: "easeOutBack",
            });

            animate(".post-card", {
              opacity: [0, 1],
              translateX: [20, 0],
              delay: stagger(60, { start: 700 }),
              duration: 500,
              easing: "easeOutCubic",
            });

            animate(".analytics-chart", {
              opacity: [0, 1],
              translateY: [30, 0],
              delay: 900,
              duration: 700,
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
  }, [isAuthed, showSkeleton]);

  return (
    <div ref={pageRef} className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-brand-dark">Dashboard</h1>
        <p className="text-brand-dark/50 mt-1">Welcome back! Here&apos;s your content overview.</p>
      </div>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {showSkeleton ? (
            Array(4).fill(0).map((_, i) => <StatsCardSkeleton key={i} />)
          ) : (
            stats.map((stat) => (
              <StatsCard key={stat.id} stat={stat} />
            ))
          )}
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-brand-dark mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            {quickActions.map((action) => (
              <QuickActionButton key={action.id} action={action} />
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-brand-dark">Recent Posts</h2>
              <button className="text-sm font-medium text-brand-dark/50 hover:text-brand-dark transition-colors">
                View All
              </button>
            </div>
            <div className="space-y-4">
              {showSkeleton ? (
                Array(4).fill(0).map((_, i) => <RecentPostSkeleton key={i} />)
              ) : (
                <>
                  {posts.map((post) => (
                    <RecentPostCard key={post.id} post={post} />
                  ))}
                  {posts.length === 0 && (
                    <div className="bg-white rounded-[20px] border-2 border-brand-dark p-8 text-center">
                      <p className="text-brand-dark/50">No recent posts found.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-brand-dark mb-4">Analytics</h2>
            {showSkeleton ? (
               <div className="bg-white rounded-[28px] border-2 border-brand-dark p-8 h-[280px] animate-pulse" />
            ) : (
              <AnalyticsChart data={viewsData} />
            )}
          </section>
        </div>
      </div>
  );
}
