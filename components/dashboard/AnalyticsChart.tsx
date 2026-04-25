"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { animate, stagger } from "animejs";
import type { ViewsDataPoint } from "@/types/types";

interface AnalyticsChartProps {
  data?: ViewsDataPoint[];
}

const defaultData: ViewsDataPoint[] = [
  { label: "Mon", value: 0 },
  { label: "Tue", value: 0 },
  { label: "Wed", value: 0 },
  { label: "Thu", value: 0 },
  { label: "Fri", value: 0 },
  { label: "Sat", value: 0 },
  { label: "Sun", value: 0 },
];

export default function AnalyticsChart({ data }: AnalyticsChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const didAnimate = useRef(false);
  const [mounted, setMounted] = useState(false);

  const chartData = data && data.length > 0 ? data : defaultData;
  const maxValue = useMemo(
    () => Math.max(...chartData.map((d) => d.value)) || 1,
    [chartData]
  );


  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const chart = chartRef.current;
    if (!chart) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !didAnimate.current) {
            didAnimate.current = true;

            animate(".chart-bar", {
              scaleY: [0, 1],
              opacity: [0, 1],
              delay: stagger(80, { start: 200 }),
              duration: 600,
              easing: "easeOutCubic",
              origin: "bottom",
            });

            observer.disconnect();
          }
        });
      },
      { threshold: 0.3 },
    );

    observer.observe(chart);
    return () => observer.disconnect();
  }, [mounted]);


  if (!mounted) {
    return (
      <div className="bg-white rounded-[28px] border-2 border-brand-dark p-8 shadow-[6px_6px_0px_0px_#191A23]">
        <h3 className="text-lg font-bold text-brand-dark mb-6">Weekly Views Trend</h3>
        <div className="flex items-end justify-between gap-3 h-40">
          {chartData.map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-2 flex-1">
              <div
                className="w-full bg-brand-lime border-2 border-brand-dark rounded-t-lg"
                style={{ height: `${(day.value / maxValue) * 100}%` }}
              />
              <span className="text-xs text-brand-dark/50 font-medium">{day.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={chartRef}
      className="analytics-chart bg-white rounded-[28px] border-2 border-brand-dark p-8 shadow-[6px_6px_0px_0px_#191A23]"
    >
      <h3 className="text-lg font-bold text-brand-dark mb-6">Weekly Views Trend</h3>
      <div className="flex items-end justify-between gap-3 h-40">
        {chartData.map((day, i) => (
          <div key={i} className="flex flex-col items-center gap-2 flex-1">
            <div
              className="chart-bar w-full bg-brand-lime border-2 border-brand-dark rounded-t-lg"
              style={{ height: `${(day.value / maxValue) * 100}%` }}
            />
            <span className="text-xs text-brand-dark/50 font-medium">{day.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
