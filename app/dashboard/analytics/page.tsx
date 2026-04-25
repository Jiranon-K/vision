"use client";

import { useEffect, useRef } from "react";
import { animate, stagger } from "animejs";
import dynamic from "next/dynamic";
import MetricCard from "@/components/dashboard/analytics/MetricCard";
import TrafficSources from "@/components/dashboard/analytics/TrafficSources";
import PopularPosts from "@/components/dashboard/analytics/PopularPosts";
import { useAuth } from "@/hooks/useAuth";
import { useAnalytics } from "@/hooks/useAnalytics";
import { StatsCardSkeleton } from "@/components/ui/Skeleton";

const AnalyticsChart = dynamic(
  () => import("@/components/dashboard/AnalyticsChart"),
  {
    loading: () => (
      <div className="bg-white rounded-[28px] border-2 border-brand-dark p-8 h-[280px] animate-pulse" />
    ),
  }
);

const statIcons: ("views" | "posts" | "subscribers" | "engagement")[] = [
  "views",
  "posts",
  "subscribers",
  "engagement",
];

export default function AnalyticsPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const didAnimate = useRef(false);
  const { isLoading: isAuthLoading, isAuthed } = useAuth();
  const { stats, viewsData, isLoading: isDataLoading } = useAnalytics(isAuthed);

  const showSkeleton = isAuthLoading || isDataLoading;

  useEffect(() => {
    if (!isAuthed || showSkeleton) {
      return;
    }

    const page = pageRef.current;
    if (!page) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !didAnimate.current) {
            didAnimate.current = true;

            animate(".metric-card", {
              opacity: [0, 1],
              translateY: [20, 0],
              delay: stagger(80, { start: 200 }),
              duration: 600,
              easing: "easeOutCubic",
            });

            animate(".analytics-chart", {
              opacity: [0, 1],
              translateY: [30, 0],
              delay: 600,
              duration: 700,
              easing: "easeOutCubic",
            });

            animate(".traffic-source", {
              opacity: [0, 1],
              translateX: [20, 0],
              delay: stagger(60, { start: 800 }),
              duration: 500,
              easing: "easeOutCubic",
            });

            animate(".popular-post", {
              opacity: [0, 1],
              translateX: [20, 0],
              delay: stagger(60, { start: 900 }),
              duration: 500,
              easing: "easeOutCubic",
            });

            observer.disconnect();
          }
        });
      },
      { threshold: 0.05 }
    );

    observer.observe(page);
    return () => observer.disconnect();
  }, [isAuthed, showSkeleton]);

  return (
    <div ref={pageRef} className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-brand-dark">Analytics</h1>
        <p className="text-brand-dark/50 mt-1">
          Track your content performance and engagement metrics.
        </p>
      </div>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {showSkeleton ? (
            Array(4).fill(0).map((_, i) => <StatsCardSkeleton key={i} />)
          ) : (
            stats.map((stat, index) => (
              <MetricCard
                key={stat.id}
                stat={stat}
                icon={statIcons[index]}
                delay={index * 80}
              />
            ))
          )}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            {showSkeleton ? (
              <div className="bg-white rounded-[28px] border-2 border-brand-dark p-8 h-[340px] animate-pulse" />
            ) : (
              <AnalyticsChart data={viewsData} />
            )}
          </div>

          <div>
            <TrafficSources sources={[]} />
          </div>
        </section>

        <section>
          <PopularPosts posts={[]} limit={5} />
        </section>
    </div>
  );
}
