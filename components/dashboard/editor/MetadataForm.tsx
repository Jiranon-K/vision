"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { categories } from "@/lib/constants";
import { apiFetch, authFetch } from "@/lib/api";
import { Spinner } from "@/components/ui/spinner";
import type { MetadataFormProps } from "./types";

// Below this, a "summary" would just echo the content back — the button stays
// visible but disabled rather than firing a request that can't say anything.
const MIN_SUGGESTION_CONTENT_LENGTH = 40;

export default function MetadataForm({
  category,
  onCategoryChange,
  status,
  onStatusChange,
  coverImage,
  onCoverImageChange,
  excerpt,
  onExcerptChange,
  content,
}: MetadataFormProps) {
  const statusOptions = ["Draft", "Published"] as const;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Single source of truth for whether this deployment has the capability at
  // all lives on the server (it holds the credentials) — never a
  // NEXT_PUBLIC_* flag that could drift from what's actually configured.
  const [suggestionAvailable, setSuggestionAvailable] = useState(false);
  const [suggesting, setSuggesting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiFetch("/api/capabilities")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setSuggestionAvailable(Boolean(data?.excerptSuggestion));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const contentTooShort = content.trim().length < MIN_SUGGESTION_CONTENT_LENGTH;

  const handleSuggest = async () => {
    setSuggesting(true);
    try {
      const res = await authFetch("/api/posts/suggest-excerpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) return;
      const data = await res.json();
      onExcerptChange(data.excerpt);
      toast.success("Excerpt suggestion added — edit it as you like.");
    } finally {
      setSuggesting(false);
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File is too large. Max 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") onCoverImageChange(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-brand-dark/60 mb-2">
          Cover Image
        </label>
        <div className="flex items-center gap-4">
          <div className="w-32 h-20 rounded-[12px] border-2 border-brand-dark bg-brand-gray overflow-hidden flex items-center justify-center shrink-0">
            {coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element -- previews a cover URL the Creator just typed, which next/image cannot optimize without a configured host
              <img
                src={coverImage}
                alt="Cover preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs text-brand-dark/30">No image</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleCoverChange}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-fit px-4 py-2 bg-brand-dark text-white rounded-xl font-bold text-sm hover:bg-brand-dark/90 transition-colors"
            >
              {coverImage ? "Change Image" : "Upload Image"}
            </button>
            {coverImage && (
              <button
                type="button"
                onClick={() => {
                  onCoverImageChange("");
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="w-fit text-sm font-medium text-brand-error hover:underline"
              >
                Remove
              </button>
            )}
            <p className="text-xs text-brand-dark/40">
              JPG, PNG or GIF. Max 2MB.
            </p>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-brand-dark/60">
            Excerpt
          </label>
          {suggestionAvailable && (
            <button
              type="button"
              onClick={handleSuggest}
              disabled={contentTooShort || suggesting}
              aria-label={
                suggesting ? "Suggesting an excerpt…" : "Suggest an excerpt"
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-brand-dark bg-white text-xs font-bold text-brand-dark hover:bg-brand-gray transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
            >
              {suggesting && <Spinner size="sm" label={null} />}
              {suggesting ? "Suggesting…" : "Suggest Excerpt"}
            </button>
          )}
        </div>
        <textarea
          value={excerpt}
          onChange={(e) => onExcerptChange(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="เว้นว่างเพื่อสร้างอัตโนมัติจากเนื้อหา"
          className="w-full px-4 py-3 rounded-[12px] border-2 border-brand-dark bg-white resize-none focus:outline-none focus:border-brand-dark text-sm leading-relaxed text-brand-dark placeholder:text-brand-dark/30"
        />
        <p className="mt-1 text-right text-xs text-brand-dark/40">
          {excerpt.length}/500
        </p>
      </div>

      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[160px]">
          <label
            htmlFor="post-category"
            className="block text-sm font-medium text-brand-dark/60 mb-2"
          >
            Category
          </label>
          <div className="relative">
            <select
              id="post-category"
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full appearance-none px-4 py-3 rounded-[12px] border-2 border-brand-dark bg-white focus:outline-none focus:border-brand-dark font-medium text-brand-dark cursor-pointer pr-10"
            >
              <option value="">Select category</option>
              {categories
                .filter((c) => c !== "All")
                .map((cat) => (
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
              <path
                d="M4 6L8 10L12 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <div className="flex-1 min-w-[160px]">
          <label
            htmlFor="post-status"
            className="block text-sm font-medium text-brand-dark/60 mb-2"
          >
            Status
          </label>
          <div className="relative">
            <select
              id="post-status"
              value={status}
              onChange={(e) =>
                onStatusChange(e.target.value as "Draft" | "Published")
              }
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
              <path
                d="M4 6L8 10L12 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
