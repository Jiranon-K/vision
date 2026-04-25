"use client";

import Link from "next/link";

interface PostsHeaderProps {
  postCount: number;
}

export default function PostsHeader({ postCount }: PostsHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-black text-brand-dark">Posts</h1>
        <p className="text-brand-dark/50 mt-1">{postCount} posts total</p>
      </div>
      <Link
        href="/dashboard/posts/new"
        className="flex items-center gap-2 bg-brand-lime border-2 border-brand-dark px-6 py-3 rounded-[16px] font-bold text-brand-dark shadow-[4px_4px_0px_0px_#191A23] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all duration-200"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        New Post
      </Link>
    </div>
  );
}
