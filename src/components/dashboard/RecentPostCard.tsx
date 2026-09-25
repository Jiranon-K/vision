"use client";

import type { DashboardPost } from "@/types/types";

interface RecentPostCardProps {
  post: DashboardPost;
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.5 2.5L15.5 4.5L6 14H4V12L13.5 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 5L13 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CategoryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 7H13M7 10H13M7 13H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function RecentPostCard({ post }: RecentPostCardProps) {
  const statusStyles = {
    Published: "bg-brand-lime text-brand-dark",
    Draft: "bg-brand-gray text-brand-dark/50",
  };

  return (
    <div className="post-card flex items-center justify-between bg-white rounded-[20px] border-2 border-brand-dark p-5 shadow-[4px_4px_0px_0px_#191A23] opacity-0 hover:-translate-y-1 hover:shadow-none transition-all duration-200">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-brand-gray flex items-center justify-center text-brand-dark/40">
          <CategoryIcon />
        </div>
        <div>
          <h4 className="font-semibold text-brand-dark line-clamp-1">{post.title}</h4>
          <div className="flex items-center gap-2 text-sm text-brand-dark/50 mt-1">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[post.status]}`}>
              {post.status}
            </span>
            <span>{post.views > 0 ? `${post.views.toLocaleString()} views` : "No views"}</span>
          </div>
        </div>
      </div>
      <button className="p-2 hover:bg-brand-gray rounded-lg transition-colors text-brand-dark/40 hover:text-brand-dark">
        <EditIcon />
      </button>
    </div>
  );
}
