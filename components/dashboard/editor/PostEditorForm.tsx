"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { animate } from "animejs";
import { toast } from "sonner";
import SplitEditor from "@/components/dashboard/editor/SplitEditor";
import MetadataForm from "@/components/dashboard/editor/MetadataForm";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { apiFetch, authFetch } from "@/lib/api";
import { postFormSchema } from "@/lib/schemas";
import type { CurrentUser } from "@/lib/auth";
import {
  draftKey,
  useAutosaveDraft,
  type PostDraftState,
} from "@/hooks/useAutosaveDraft";

interface PostEditorFormProps {
  mode: "create" | "edit";
  postId?: string;
  currentUser: CurrentUser | null;
}

type LoadError = "notfound" | "forbidden" | "generic" | null;

const EMPTY: PostDraftState = {
  title: "",
  content: "",
  category: "",
  status: "Draft",
  excerpt: "",
  coverImage: "",
};

function sameDraft(a: PostDraftState, b: PostDraftState): boolean {
  return (
    a.title === b.title &&
    a.content === b.content &&
    a.category === b.category &&
    a.status === b.status &&
    a.excerpt === b.excerpt &&
    a.coverImage === b.coverImage
  );
}

export default function PostEditorForm({
  mode,
  postId,
  currentUser,
}: PostEditorFormProps) {
  const router = useRouter();
  const pageRef = useRef<HTMLDivElement>(null);
  const didAnimate = useRef(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<"Draft" | "Published">("Draft");
  const [excerpt, setExcerpt] = useState("");
  const [coverImage, setCoverImage] = useState("");

  const [loading, setLoading] = useState(mode === "edit");
  const [loadError, setLoadError] = useState<LoadError>(null);
  const [saving, setSaving] = useState(false);

  const [baseline, setBaseline] = useState<PostDraftState>(EMPTY);
  const [updatedAtMs, setUpdatedAtMs] = useState(0);
  const [ownerId, setOwnerId] = useState("");

  const [showRestore, setShowRestore] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);

  const restoreDecided = useRef(false);
  const skipUnload = useRef(false);

  const formState: PostDraftState = useMemo(
    () => ({ title, content, category, status, excerpt, coverImage }),
    [title, content, category, status, excerpt, coverImage],
  );

  const ready = mode === "create" || (!loading && !loadError);

  // The backend enforces ownership (403 on save), but mirror it in the UI so a
  // non-owner who reaches the edit URL directly sees a read-only state.
  const canEdit =
    mode === "create" ||
    currentUser?.role === "admin" ||
    (!!ownerId && ownerId === currentUser?.id);

  const { existingDraft, clearDraft } = useAutosaveDraft(
    draftKey(postId),
    formState,
    { enabled: ready && canEdit },
  );

  const isDirty = useMemo(
    () => ready && canEdit && !sameDraft(formState, baseline),
    [ready, canEdit, formState, baseline],
  );

  // --- Edit mode: load the existing post -------------------------------------
  const fetchPost = useCallback(async () => {
    if (mode !== "edit" || !postId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const res = await apiFetch(`/api/posts/${postId}`);
      if (res.status === 404) {
        setLoadError("notfound");
        toast.error("ไม่พบ post นี้");
        return;
      }
      if (res.status === 403) {
        setLoadError("forbidden");
        toast.error("ไม่มีสิทธิ์เข้าถึง post นี้");
        return;
      }
      if (!res.ok) {
        setLoadError("generic");
        toast.error("โหลด post ไม่สำเร็จ");
        return;
      }

      const post = await res.json();
      const snapshot: PostDraftState = {
        title: post.title || "",
        content: post.content || "",
        category: post.category || "",
        status: post.status || "Draft",
        excerpt: post.excerpt || "",
        coverImage: post.coverImage || "",
      };
      setTitle(snapshot.title);
      setContent(snapshot.content);
      setCategory(snapshot.category);
      setStatus(snapshot.status);
      setExcerpt(snapshot.excerpt);
      setCoverImage(snapshot.coverImage);
      setBaseline(snapshot);
      setUpdatedAtMs(post.updatedAt ? new Date(post.updatedAt).getTime() : 0);
      setOwnerId(String(post.owner ?? ""));
    } catch {
      setLoadError("generic");
      toast.error("โหลด post ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [mode, postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  // --- Offer to restore an autosaved draft -----------------------------------
  useEffect(() => {
    if (restoreDecided.current || !existingDraft) return;
    if (mode === "edit" && (loading || loadError)) return;

    restoreDecided.current = true;

    if (mode === "create") {
      if ((existingDraft.title ?? "").trim() || (existingDraft.content ?? "").trim()) {
        setShowRestore(true);
      }
      return;
    }

    const draftNewer = existingDraft.savedAt > updatedAtMs;
    const differs =
      existingDraft.title !== baseline.title ||
      existingDraft.content !== baseline.content;
    if (draftNewer || differs) {
      setShowRestore(true);
    }
  }, [existingDraft, loading, loadError, mode, updatedAtMs, baseline]);

  const applyRestore = () => {
    if (existingDraft) {
      // Coalesce in case a stored draft predates a field (never write undefined
      // into a controlled input — it breaks `value` and `excerpt.length`).
      setTitle(existingDraft.title ?? "");
      setContent(existingDraft.content ?? "");
      setCategory(existingDraft.category ?? "");
      setStatus(existingDraft.status === "Published" ? "Published" : "Draft");
      setExcerpt(existingDraft.excerpt ?? "");
      setCoverImage(existingDraft.coverImage ?? "");
    }
    setShowRestore(false);
  };

  const discardRestore = () => {
    clearDraft();
    setShowRestore(false);
  };

  // --- Warn before losing unsaved work ---------------------------------------
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (skipUnload.current || !isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const handleBack = () => {
    if (isDirty) {
      setShowBackConfirm(true);
      return;
    }
    router.push("/dashboard/posts");
  };

  const confirmBack = () => {
    skipUnload.current = true;
    setShowBackConfirm(false);
    router.push("/dashboard/posts");
  };

  // --- Entrance animations (run once the form is on screen) ------------------
  useEffect(() => {
    if (!ready) return;
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
  }, [ready]);

  // --- Save -------------------------------------------------------------------
  const handleSave = async () => {
    if (!canEdit) {
      toast.error("คุณไม่มีสิทธิ์แก้ไข post นี้");
      return;
    }

    const parsed = postFormSchema.safeParse({
      title,
      content,
      category,
      status,
      excerpt: excerpt || undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
      return;
    }

    setSaving(true);
    try {
      const path = mode === "edit" ? `/api/posts/${postId}` : "/api/posts";
      const method = mode === "edit" ? "PUT" : "POST";
      const res = await authFetch(path, {
        method,
        headers: { "Content-Type": "application/json" },
        // readTime + excerpt fallback are derived server-side.
        body: JSON.stringify({ title, content, category, status, coverImage, excerpt }),
      });

      if (res.ok) {
        skipUnload.current = true;
        clearDraft();
        router.replace("/dashboard/posts");
        return;
      }

      const data = await res.json().catch(() => ({}));
      toast.error(
        data.error ||
          (mode === "edit" ? "Failed to update post" : "Failed to save post"),
      );
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  // --- Render -----------------------------------------------------------------
  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-brand-dark/50">Loading...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    const messages: Record<Exclude<LoadError, null>, string> = {
      notfound: "ไม่พบ post ที่ต้องการแก้ไข",
      forbidden: "คุณไม่มีสิทธิ์เข้าถึง post นี้",
      generic: "โหลด post ไม่สำเร็จ",
    };
    return (
      <div className="p-8">
        <div className="bg-white rounded-[20px] border-2 border-brand-dark p-8 shadow-[4px_4px_0px_0px_#191A23] text-center">
          <h3 className="text-lg font-bold text-brand-dark mb-2">
            {messages[loadError]}
          </h3>
          <div className="flex items-center justify-center gap-3 mt-4">
            {loadError === "generic" && (
              <button
                onClick={fetchPost}
                className="px-5 py-2.5 bg-brand-lime border-2 border-brand-dark rounded-[12px] font-bold text-brand-dark shadow-[4px_4px_0px_0px_#191A23] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all duration-200"
              >
                Retry
              </button>
            )}
            <button
              onClick={() => router.push("/dashboard/posts")}
              className="px-5 py-2.5 bg-brand-gray border-2 border-brand-dark rounded-[12px] font-medium text-brand-dark"
            >
              Back to Posts
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={pageRef} className="p-8">
      <div className="editor-header opacity-0 flex items-center justify-between mb-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-brand-dark/60 hover:text-brand-dark transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-medium">Back to Posts</span>
        </button>

        <button
          onClick={handleSave}
          disabled={saving || !canEdit}
          className="flex items-center gap-2 bg-brand-lime border-2 border-brand-dark px-6 py-3 rounded-[16px] font-bold text-brand-dark shadow-[4px_4px_0px_0px_#191A23] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 4V16H16V7L12 3H4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 3V7H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {saving
            ? "Saving..."
            : mode === "edit"
              ? "Update Post"
              : "Save Post"}
        </button>
      </div>

      {!canEdit && (
        <div className="editor-content opacity-0 mb-6 px-5 py-3 rounded-[16px] border-2 border-brand-dark bg-brand-gray text-sm font-medium text-brand-dark/70">
          คุณไม่ได้เป็นเจ้าของ post นี้ — ดูได้อย่างเดียว แก้ไขไม่ได้
        </div>
      )}

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
            status={status}
            onStatusChange={setStatus}
            coverImage={coverImage}
            onCoverImageChange={setCoverImage}
            excerpt={excerpt}
            onExcerptChange={setExcerpt}
          />
        </div>
      </div>

      <div className="mt-6 lg:hidden">
        <button
          onClick={handleBack}
          className="flex items-center justify-center gap-2 w-full py-3 bg-brand-gray border-2 border-brand-dark rounded-[16px] font-medium text-brand-dark"
        >
          Back to Posts
        </button>
      </div>

      <ConfirmDialog
        open={showRestore}
        title="กู้คืน draft"
        message="พบ draft ที่ยังไม่บันทึก ต้องการกู้คืนหรือไม่?"
        confirmText="กู้คืน"
        cancelText="ละทิ้ง"
        onConfirm={applyRestore}
        onCancel={discardRestore}
      />

      <ConfirmDialog
        open={showBackConfirm}
        title="ออกโดยไม่บันทึก"
        message="มีการแก้ไขที่ยังไม่บันทึก ต้องการออกหรือไม่?"
        confirmText="ออก"
        cancelText="อยู่ต่อ"
        danger
        onConfirm={confirmBack}
        onCancel={() => setShowBackConfirm(false)}
      />
    </div>
  );
}
