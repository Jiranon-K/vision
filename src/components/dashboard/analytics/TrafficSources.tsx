"use client";

import type { TrafficSource } from "@/types/types";

interface TrafficSourcesProps {
  sources: TrafficSource[];
}

export default function TrafficSources({ sources }: TrafficSourcesProps) {
  return (
    <div className="bg-white rounded-[28px] border-2 border-brand-dark p-6 shadow-[6px_6px_0px_0px_#191A23]">
      <h3 className="text-lg font-bold text-brand-dark mb-6">Traffic Sources</h3>
      <div className="space-y-5">
        {sources.map((source) => (
          <div key={source.source} className="traffic-source opacity-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-brand-dark">{source.source}</span>
              <span className="text-sm font-bold text-brand-dark">{source.visits.toLocaleString()}</span>
            </div>
            <div className="h-3 bg-brand-gray rounded-full overflow-hidden border border-brand-dark/20">
              <div
                className="h-full bg-brand-lime border border-brand-dark rounded-full"
                style={{ width: `${source.percentage}%` }}
              />
            </div>
            <span className="text-xs text-brand-dark/50 mt-1 inline-block">{source.percentage}% of total</span>
          </div>
        ))}
      </div>
    </div>
  );
}
