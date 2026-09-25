"use client";

import { categories, statusFilters } from "@/lib/constants";

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeStatus: string;
  onStatusChange: (status: string) => void;
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function FilterBar({
  searchQuery,
  onSearchChange,
  activeStatus,
  onStatusChange,
  activeCategory,
  onCategoryChange,
}: FilterBarProps) {
  return (
    <div className="bg-white rounded-[20px] border-2 border-brand-dark p-4 mb-6 shadow-[4px_4px_0px_0px_#191A23]">
      <div className="flex flex-col lg:flex-row gap-4">
        
        <div className="flex-1">
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-dark/40"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
              <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-[12px] border-2 border-brand-dark/20 bg-brand-gray focus:border-brand-dark focus:outline-none transition-colors font-medium text-brand-dark placeholder:text-brand-dark/40"
            />
          </div>
        </div>

        
        <div className="flex items-center gap-2 flex-wrap">
          {statusFilters.map((status) => (
            <button
              key={status}
              onClick={() => onStatusChange(status)}
              className={`px-4 py-2 rounded-[12px] font-medium text-sm transition-all duration-200 ${
                activeStatus === status
                  ? "bg-brand-dark text-brand-lime"
                  : "bg-brand-gray text-brand-dark/60 hover:bg-brand-dark/10"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        
        <div className="relative min-w-[160px]">
          <select
            value={activeCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full appearance-none px-4 py-3 rounded-[12px] border-2 border-brand-dark/20 bg-brand-gray focus:border-brand-dark focus:outline-none transition-colors font-medium text-brand-dark cursor-pointer pr-10"
          >
            {categories.map((cat) => (
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
    </div>
  );
}
