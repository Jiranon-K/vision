"use client";

import { toast } from "sonner";

export default function ShareButtons({ url }: { url: string }) {
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <div className="flex items-center gap-3 py-8 mt-8 border-t border-brand-dark/10">
      <span className="text-sm font-semibold text-brand-dark/60 mr-1">
        Share
      </span>
      <button
        type="button"
        onClick={copyLink}
        aria-label="Copy link"
        className="w-10 h-10 rounded-full border-2 border-brand-dark/10 flex items-center justify-center text-brand-dark/70 hover:border-brand-lime hover:bg-brand-lime hover:text-brand-dark transition-all"
      >
        <svg
          viewBox="0 0 24 24"
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      </button>
    </div>
  );
}
