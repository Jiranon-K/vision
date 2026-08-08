"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { animate, set, cubicBezier } from "animejs";
import { toast } from "sonner";
import SplitEditor from "@/components/dashboard/editor/SplitEditor";
import MetadataForm from "@/components/dashboard/editor/MetadataForm";
import EditorTopBar from "@/components/dashboard/editor/EditorTopBar";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { apiFetch, authFetch } from "@/lib/api";
import { postFormSchema } from "@/lib/schemas";
import type { CurrentUser } from "@/lib/auth";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
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

// Mirrors --duration-slow / --ease-out from app/globals.css — animejs
// animates DOM properties directly and can't read CSS custom properties, so
// the token's *value* is duplicated here rather than its name.
const ENTRANCE_DURATION = 300;
const ENTRANCE_EASE = cubicBezier(0.16, 1, 0.3, 1);

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
  const contentRef = useRef<HTMLDivElement>(null);
  const didAnimate = useRef(false);
  const prefersReducedMotion = usePrefersReducedMotion();

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
  // Gates the top bar's entrance — it waits for the writing surface's own
  // animation to start, so the arrival order is never a race.
  const [enterAnimation, setEnterAnimation] = useState(false);

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

  // --- Entrance: trigger once the form is on screen ---------------------------
  useEffect(() => {
    if (!ready) return;
    const page = pageRef.current;
    if (!page) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !didAnimate.current) {
            didAnimate.current = true;
            setEnterAnimation(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.05 },
    );

    observer.observe(page);
    return () => observer.disconnect();
  }, [ready]);

  // The Creator came to write, so the title and the writing surface arrive
  // first, together — opacity plus a small upward translate. The bar (see
  // EditorTopBar) follows on its own delay, opacity only, no translate.
  useEffect(() => {
    if (!enterAnimation) return;
    const content = contentRef.current;
    if (!content) return;

    if (prefersReducedMotion) {
      set(content, { opacity: 1, translateY: 0 });
      return;
    }

    animate(content, {
      opacity: [0, 1],
      translateY: [16, 0],
      duration: ENTRANCE_DURATION,
      ease: ENTRANCE_EASE,
    });
  }, [enterAnimation, prefersReducedMotion]);

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
      <div className="min-h-screen bg-surface-muted p-8">
        <div className="flex h-64 items-center justify-center">
          <p className="text-text-muted">Loading...</p>
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
      <div className="min-h-screen bg-surface-muted p-8">
        <div className="rounded-2xl border-2 border-border-strong bg-surface p-8 text-center shadow-hard">
          <h3 className="mb-2 text-lg font-bold text-foreground">
            {messages[loadError]}
          </h3>
          <div className="mt-4 flex items-center justify-center gap-3">
            {loadError === "generic" && (
              <Button variant="secondary" size="sm" onClick={fetchPost}>
                Retry
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard/posts")}
            >
              Back to Posts
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={pageRef} className="min-h-screen bg-surface-muted">
      <EditorTopBar
        entering={enterAnimation}
        onBack={handleBack}
        saveLabel={saving ? "Saving..." : mode === "edit" ? "Update Post" : "Save Post"}
        saving={saving}
        canSave={canEdit}
        onSave={handleSave}
      />

      {/* Reserves the bar's height in the flow — the bar itself is `fixed`
          and never affects this padding, so it can fade in/out freely
          without moving anything below it. */}
      <div className="pt-[60px] md:pt-16">
        <div ref={contentRef} className="mx-auto max-w-5xl p-8 opacity-0">
          {!canEdit && (
            <div className="mb-6 rounded-2xl border border-border bg-surface-muted px-5 py-3 text-sm font-medium text-text-secondary">
              คุณไม่ได้เป็นเจ้าของ post นี้ — ดูได้อย่างเดียว แก้ไขไม่ได้
            </div>
          )}

          <div className="mb-6">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter post title..."
              className="w-full rounded-2xl border-2 border-border-strong bg-surface px-6 py-4 text-2xl font-black text-foreground shadow-hard transition-all duration-200 placeholder:text-text-faint focus:translate-x-1 focus:translate-y-1 focus:shadow-none focus:outline-none"
            />
          </div>

          <div className="mb-6">
            <SplitEditor value={content} onChange={setContent} />
          </div>

          <div>
            <div className="rounded-2xl border-2 border-border-strong bg-surface p-6 shadow-hard">
              <h3 className="mb-4 text-lg font-bold text-foreground">Post Settings</h3>
              <MetadataForm
                category={category}
                onCategoryChange={setCategory}
                status={status}
                onStatusChange={setStatus}
                coverImage={coverImage}
                onCoverImageChange={setCoverImage}
                excerpt={excerpt}
                onExcerptChange={setExcerpt}
                content={content}
                postId={mode === "edit" ? postId : undefined}
              />
            </div>
          </div>
        </div>
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
