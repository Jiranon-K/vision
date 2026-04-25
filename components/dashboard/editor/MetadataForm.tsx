"use client";

import { categories } from "@/lib/constants";
import type { MetadataFormProps } from "./types";

export default function MetadataForm({
  category,
  onCategoryChange,
  tag,
  onTagChange,
  status,
  onStatusChange,
  scheduledDate,
  onScheduledDateChange,
}: MetadataFormProps) {
  const statusOptions = ["Draft", "Scheduled", "Published"] as const;

  return (
    <div className="flex flex-wrap gap-4 items-end">
      
      <div className="flex-1 min-w-[160px]">
        <label className="block text-sm font-medium text-brand-dark/60 mb-2">Category</label>
        <div className="relative">
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full appearance-none px-4 py-3 rounded-[12px] border-2 border-brand-dark bg-white focus:outline-none focus:border-brand-dark font-medium text-brand-dark cursor-pointer pr-10"
          >
            <option value="">Select category</option>
            {categories.filter((c) => c !== "All").map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <svg
            className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-dark/60"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      
      <div className="flex-1 min-w-[160px]">
        <label className="block text-sm font-medium text-brand-dark/60 mb-2">Tag</label>
        <input
          type="text"
          value={tag}
          onChange={(e) => onTagChange(e.target.value)}
          placeholder="e.g. Tutorial"
          className="w-full px-4 py-3 rounded-[12px] border-2 border-brand-dark bg-white focus:outline-none focus:border-brand-dark font-medium text-brand-dark placeholder:text-brand-dark/30"
        />
      </div>

      
      <div className="flex-1 min-w-[160px]">
        <label className="block text-sm font-medium text-brand-dark/60 mb-2">Status</label>
        <div className="relative">
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value as "Draft" | "Scheduled" | "Published")}
            className="w-full appearance-none px-4 py-3 rounded-[12px] border-2 border-brand-dark bg-white focus:outline-none focus:border-brand-dark font-medium text-brand-dark cursor-pointer pr-10"
          >
            {statusOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <svg
            className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-dark/60"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      
      {status === "Scheduled" && (
        <div className="flex-1 min-w-[160px]">
          <label className="block text-sm font-medium text-brand-dark/60 mb-2">Publish Date</label>
          <input
            type="datetime-local"
            value={scheduledDate}
            onChange={(e) => onScheduledDateChange(e.target.value)}
            className="w-full px-4 py-3 rounded-[12px] border-2 border-brand-dark bg-white focus:outline-none focus:border-brand-dark font-medium text-brand-dark"
          />
        </div>
      )}
    </div>
  );
}
