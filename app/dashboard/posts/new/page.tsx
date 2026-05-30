"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { animate } from "animejs";
import Link from "next/link";
import SplitEditor from "@/components/dashboard/editor/SplitEditor";
import MetadataForm from "@/components/dashboard/editor/MetadataForm";
import { useAuth } from "@/hooks/useAuth";
import { authFetch } from "@/lib/api";
import { toast } from "sonner";

export default function NewPostPage() {
  const router = useRouter();
  const pageRef = useRef<HTMLDivElement>(null);
  const didAnimate = useRef(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tag, setTag] = useState("");
  const [status, setStatus] = useState<"Draft" | "Scheduled" | "Published">("Draft");
  const [scheduledDate, setScheduledDate] = useState("");
  const [saving, setSaving] = useState(false);

  const { isLoading, isAuthed } = useAuth();

  useEffect(() => {
    if (!isAuthed) return;

    const page = pageRef.current;
    if (!page) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !didAnimate.current) {
            didAnimate.current = true;

            animate(".editor-header", {
              opacity: [0, 1],
              translateY: [20, 0],
              duration: 500,
              easing: "easeOutCubic",
            });

            animate(".editor-content", {
              opacity: [0, 1],
              translateY: [20, 0],
              delay: 100,
              duration: 500,
              easing: "easeOutCubic",
            });

            animate(".metadata-form", {
              opacity: [0, 1],
              translateY: [20, 0],
              delay: 200,
              duration: 500,
              easing: "easeOutCubic",
            });

            observer.disconnect();
          }
        });
      },
      { threshold: 0.05 },
    );

    observer.observe(page);
    return () => observer.disconnect();
  }, [isAuthed]);

  if (isLoading) {
    return <div className="min-h-screen bg-brand-gray" />;
  }

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("กรุณาใส่หัวข้อ post");
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
          category,
          tag,
          status,
          scheduledDate: scheduledDate || undefined,
          excerpt: content.slice(0, 150) + "...",
          readTime: `${Math.ceil(content.split(" ").length / 200) + 1} min read`,
        }),
      });

      if (res.ok) {
        router.replace("/dashboard/posts");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to save post");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div ref={pageRef} className="p-8">
      <div className="editor-header opacity-0 flex items-center justify-between mb-6">
        <Link
          href="/dashboard/posts"
          className="flex items-center gap-2 text-brand-dark/60 hover:text-brand-dark transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-medium">Back to Posts</span>
        </Link>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-brand-lime border-2 border-brand-dark px-6 py-3 rounded-[16px] font-bold text-brand-dark shadow-[4px_4px_0px_0px_#191A23] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all duration-200 disabled:opacity-50"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 4V16H16V7L12 3H4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 3V7H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {saving ? "Saving..." : "Save Post"}
        </button>
      </div>

      <div className="editor-content opacity-0 mb-6">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter post title..."
          className="w-full px-6 py-4 text-2xl font-black text-brand-dark placeholder:text-brand-dark/30 bg-white rounded-[20px] border-2 border-brand-dark shadow-[4px_4px_0px_0px_#191A23] focus:outline-none focus:shadow-none focus:translate-x-1 focus:translate-y-1 transition-all duration-200"
        />
      </div>

      <div className="editor-content opacity-0 mb-6">
        <SplitEditor value={content} onChange={setContent} />
      </div>

      <div className="editor-content opacity-0">
        <div className="bg-white rounded-[20px] border-2 border-brand-dark p-6 shadow-[4px_4px_0px_0px_#191A23]">
          <h3 className="text-lg font-bold text-brand-dark mb-4">Post Settings</h3>
          <MetadataForm
            category={category}
            onCategoryChange={setCategory}
            tag={tag}
            onTagChange={setTag}
            status={status}
            onStatusChange={setStatus}
            scheduledDate={scheduledDate}
            onScheduledDateChange={setScheduledDate}
          />
        </div>
      </div>

      <div className="mt-6 lg:hidden">
        <Link
          href="/dashboard/posts"
          className="flex items-center justify-center gap-2 w-full py-3 bg-brand-gray border-2 border-brand-dark rounded-[16px] font-medium text-brand-dark"
        >
          Back to Posts
        </Link>
      </div>
    </div>
  );
}
