"use client";

import type { DashboardStat } from "@/types/types";

interface StatsCardProps {
  stat: DashboardStat;
}

export default function StatsCard({ stat }: StatsCardProps) {
  return (
    <div className="stats-card bg-white rounded-[24px] border-2 border-brand-dark p-6 shadow-[6px_6px_0px_0px_#191A23] opacity-0">
      <span className="text-sm font-medium text-brand-dark/50">{stat.label}</span>
      <div className="mt-2">
        <span className="text-3xl font-black text-brand-dark">{stat.value}</span>
      </div>
      <span
        className={`text-sm font-medium mt-2 inline-block ${
          stat.changeType === "positive" ? "text-green-600" : "text-red-500"
        }`}
      >
        {stat.change}
      </span>
    </div>
  );
}
