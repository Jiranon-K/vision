"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { animate, set, cubicBezier } from "animejs";
import { toast } from "sonner";
import SplitEditor from "@/components/dashboard/editor/SplitEditor";
import PostTitleField from "@/components/dashboard/editor/PostTitleField";
import MetadataForm from "@/components/dashboard/editor/MetadataForm";
import EditorTopBar from "@/components/dashboard/editor/EditorTopBar";
import PublishSheet from "@/components/dashboard/editor/PublishSheet";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { apiFetch, authFetch } from "@/lib/api";
import { postFormSchema } from "@/lib/schemas";
import type { CurrentUser } from "@/lib/auth";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { EditorMode } from "@/components/dashboard/editor/types";
import type { AutosaveStatus } from "@/components/dashboard/editor/AutosaveStatusSlot";
import {
  draftKey,
  useAutosaveDraft,
  type PostDraftState,
} from "@/hooks/useAutosaveDraft";

// Two panes of prose only both keep a readable measure at lg (1024px) and
// up — the same width Tailwind's own `lg:` breakpoint already treats as
// "room for a second column". Below it Split is withheld, not just
// disabled (see EditorModeSwitchSlot).
const SPLIT_AVAILABLE_QUERY = "(min-width: 1024px)";

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

// How long a Draft -> Published save holds on the editor, playing the top
// bar's crossfade and accent wash, before leaving for the posts list.
// Deliberately the slowest thing on this screen (ticket 04) — mirrored in
// EditorTopBar's PUBLISH_WASH_MS since animejs there can't read this value.
const PUBLISH_TRANSITION_HOLD_MS = 900;

// Human-readable age for the restore dialog's "how old is this Draft"
// requirement — coarser than AutosaveStatusSlot's live "Xs ago" clock since
// this renders once, on open, rather than ticking.
function formatDraftAge(savedAt: number): string {
  const seconds = Math.floor((Date.now() - savedAt) / 1000);
  if (seconds < 60) return "less than a minute ago";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

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
  const loadErrorPrimaryRef = useRef<HTMLButtonElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<"Draft" | "Published">("Draft");
  const [excerpt, setExcerpt] = useState("");
  const [coverImage, setCoverImage] = useState("");

  // Write is the default per the ticket, regardless of viewport.
  const [editorMode, setEditorMode] = useState<EditorMode>("write");
  const splitAvailable = useMediaQuery(SPLIT_AVAILABLE_QUERY);

  const [loading, setLoading] = useState(mode === "edit");
  const [loadError, setLoadError] = useState<LoadError>(null);
  const [saving, setSaving] = useState(false);

  const [baseline, setBaseline] = useState<PostDraftState>(EMPTY);
  const [updatedAtMs, setUpdatedAtMs] = useState(0);
  const [ownerId, setOwnerId] = useState("");

  const [showRestore, setShowRestore] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [publishSheetOpen, setPublishSheetOpen] = useState(false);
  // True for one brief window right after a Draft -> Published save lands —
  // see handlePublishConfirm and PUBLISH_TRANSITION_HOLD_MS above.
  const [statusAccent, setStatusAccent] = useState(false);
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

  const {
    existingDraft,
    clearDraft,
    lastSavedAt: autosaveSavedAt,
    dirty: autosaveDirty,
    saving: autosaveSaving,
    saveNow,
  } = useAutosaveDraft(draftKey(postId), formState, { enabled: ready && canEdit });

  const isDirty = useMemo(
    () => ready && canEdit && !sameDraft(formState, baseline),
    [ready, canEdit, formState, baseline],
  );

  // What the Publish sheet's checklist reports, in the Creator's own terms
  // rather than a field name — the server requires all three regardless of
  // Draft or Published, so this is the same gate stated plainly instead of
  // left for the confirm button's disabled state to imply (ticket 04).
  const publishChecklist = useMemo(
    () => [
      { id: "title", label: "Give the Post a title", done: title.trim().length > 0 },
      { id: "content", label: "Write something in the Post", done: content.trim().length > 0 },
      { id: "category", label: "Choose a Category", done: category.trim().length > 0 },
    ],
    [title, content, category],
  );

  // The chip's "last commit" is the more recent of the local autosave and
  // (in edit mode) the Post's own last server save — a freshly opened,
  // unedited Post already has something honest to report ("Autosaved
  // <time since updatedAt>"), not "New Post". A brand-new create-mode Post
  // has neither, until its first local commit lands.
  const autosaveLastSavedAt =
    mode === "edit" ? Math.max(autosaveSavedAt ?? 0, updatedAtMs || 0) || null : autosaveSavedAt;

  const autosaveStatus: AutosaveStatus = autosaveSaving
    ? "saving"
    : autosaveLastSavedAt === null
      ? "new"
      : autosaveDirty
        ? "writing"
        : "saved";

  // --- Edit mode: load the existing post -------------------------------------
  const fetchPost = useCallback(async () => {
    if (mode !== "edit" || !postId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const res = await apiFetch(`/api/posts/${postId}`);
      // No toast here — the load-error state below takes over the canvas
      // instead of hiding behind one.
      if (res.status === 404) {
        setLoadError("notfound");
        return;
      }
      if (res.status === 403) {
        setLoadError("forbidden");
        return;
      }
      if (!res.ok) {
        setLoadError("generic");
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
    } finally {
      setLoading(false);
    }
  }, [mode, postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  // The load-error canvas is a destination, not a passive message — send
  // focus to its primary action (Retry, or Back to Posts when there is no
  // Retry) the moment it appears.
  useEffect(() => {
    if (loadError) loadErrorPrimaryRef.current?.focus();
  }, [loadError]);

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

  // A Creator who opened Split on a wide window and then narrowed it past
  // the breakpoint can't be left on a mode the switch no longer offers.
  useEffect(() => {
    if (editorMode === "split" && !splitAvailable) {
      setEditorMode("write");
    }
  }, [editorMode, splitAvailable]);

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
  // Writes the Post exactly as it stands right now. Shared by the top bar's
  // plain Save and the Publish sheet's confirm — the two never fire the same
  // request for different reasons, they fire the same request for whatever
  // `status` currently holds. What differs is only what each caller does
  // once it resolves (see handleSave / handlePublishConfirm below).
  const persist = async (): Promise<boolean> => {
    if (!canEdit) {
      toast.error("You don't have permission to edit this Post.");
      return false;
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
      return false;
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
        clearDraft();
        // Keeps `isDirty` (and the beforeunload guard) honest for the
        // animated Publish path below, which stays on this page briefly
        // instead of navigating away the instant the request resolves.
        setBaseline({ title, content, category, status, excerpt, coverImage });
        return true;
      }

      const data = await res.json().catch(() => ({}));
      toast.error(
        data.error ||
          (mode === "edit" ? "Failed to update post" : "Failed to save post"),
      );
      return false;
    } catch {
      toast.error("Something went wrong");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const leaveForPostsList = () => {
    skipUnload.current = true;
    router.replace("/dashboard/posts");
  };

  // The top bar's plain Save — persists a Draft (or re-saves a Published
  // Post) without touching status and without ever opening the Publish
  // sheet. This is what makes "save a Draft to the server" and "Publish"
  // two different controls rather than the same one pressed twice.
  const handleSave = async () => {
    if (await persist()) leaveForPostsList();
  };

  // The Publish sheet's confirm. Always just persists — Category and
  // Draft/Published were already decided by the sheet's own controls,
  // which write straight into `category` / `status` above. The only thing
  // this function decides is whether the save that just landed was a real
  // Draft -> Published transition, which is the one case that earns the
  // top bar's slow crossfade before leaving.
  const handlePublishConfirm = async () => {
    const wasPublished = baseline.status === "Published";
    if (!(await persist())) return;

    setPublishSheetOpen(false);
    const justPublished = !wasPublished && status === "Published";

    if (justPublished) {
      setStatusAccent(true);
      window.setTimeout(() => {
        setStatusAccent(false);
        leaveForPostsList();
      }, PUBLISH_TRANSITION_HOLD_MS);
    } else {
      leaveForPostsList();
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
    // Distinguishes the three failure kinds by tone as well as copy: neither
    // party is at fault when a Post simply isn't there, access is a boundary
    // being enforced (warning), and a failed request is the one kind worth
    // reading as an actual error.
    const tone: Record<Exclude<LoadError, null>, "neutral" | "warning" | "error"> = {
      notfound: "neutral",
      forbidden: "warning",
      generic: "error",
    };
    const heading: Record<Exclude<LoadError, null>, string> = {
      notfound: "Post not found",
      forbidden: "You don't have access to this Post",
      generic: "This Post failed to load",
    };
    const description: Record<Exclude<LoadError, null>, string> = {
      notfound: "It may have been deleted, or the link is wrong.",
      forbidden: "You aren't the owner of this Post, so it can't be opened here.",
      generic: "Something went wrong while loading. Check your connection and try again.",
    };

    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-muted p-8">
        <Card variant="elevated" className="w-full max-w-md p-8">
          {/* Leads with the one thing that matters: whether the Creator's
              local work is safe. Only shown when `existingDraft` — read
              straight from the autosave hook — proves it's actually there. */}
          {existingDraft && (
            <Alert tone="success" className="mb-4">
              Your local Draft is safe. It&apos;s saved on this device and
              nothing has been lost.
            </Alert>
          )}

          <Alert tone={tone[loadError]} title={heading[loadError]}>
            {description[loadError]}
          </Alert>

          <div className="mt-6 flex items-center justify-center gap-3">
            {loadError === "generic" && (
              <Button ref={loadErrorPrimaryRef} variant="secondary" size="sm" onClick={fetchPost}>
                Retry
              </Button>
            )}
            <Button
              ref={loadError === "generic" ? undefined : loadErrorPrimaryRef}
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard/posts")}
            >
              Back to Posts
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // What the sheet's confirm button says: "Publish" only when this save
  // would actually be the Draft -> Published transition, "Save" when a
  // Published Post is simply being re-saved, "Save Draft" otherwise — so
  // choosing Draft in the sheet never reads as an act of publishing.
  const publishConfirmLabel =
    status === "Published"
      ? baseline.status === "Published"
        ? "Save"
        : "Publish"
      : "Save Draft";

  return (
    <div ref={pageRef} className="min-h-screen bg-surface-muted">
      <EditorTopBar
        entering={enterAnimation}
        onBack={handleBack}
        status={status}
        statusAccent={statusAccent}
        saving={saving}
        showSave={canEdit}
        onSave={handleSave}
        onOpenPublish={() => setPublishSheetOpen(true)}
        mode={editorMode}
        onModeChange={setEditorMode}
        splitAvailable={splitAvailable}
        autosaveStatus={autosaveStatus}
        autosaveLastSavedAt={autosaveLastSavedAt}
        content={content}
        autosaveDirty={autosaveDirty}
        onSaveNow={saveNow}
      />

      {/* Reserves the bar's height in the flow — the bar itself is `fixed`
          and never affects this padding, so it can fade in/out freely
          without moving anything below it. */}
      <div className="pt-[60px] md:pt-16">
        <div
          ref={contentRef}
          className="mx-auto flex min-h-[calc(100vh-60px)] max-w-5xl flex-col p-8 opacity-0 md:min-h-[calc(100vh-4rem)]"
        >
          {!canEdit && (
            <Alert tone="neutral" className="mb-6">
              You don&apos;t own this Post — you can view it, but not edit it.
            </Alert>
          )}

          {/* A Creator who can't own a save also can't be left with anything
              that pretends otherwise — `inert` (not per-field `disabled`)
              takes the whole writing surface and Post Settings out of the
              tab order and off the hit-test in one place, so nothing here
              has to know it's being viewed read-only. */}
          <div inert={!canEdit || undefined} className="contents">
            {/* The measure — capped and centred — belongs to the title and
                the writing surface, not the whole page: Post Settings below
                is a form, not prose, so it keeps the wider column. Split is
                the one mode that needs the extra width, since it is two
                measures side by side rather than one. */}
            <div className="mx-auto mb-6 w-full max-w-prose">
              <PostTitleField value={title} onChange={setTitle} />
            </div>

            <div
              className={`mx-auto mb-6 flex w-full flex-1 flex-col ${
                editorMode === "split" ? "max-w-5xl" : "max-w-prose"
              }`}
            >
              <SplitEditor value={content} onChange={setContent} mode={editorMode} />
            </div>

            <div>
              <div className="rounded-2xl border-2 border-border-strong bg-surface p-6 shadow-hard">
                <h3 className="mb-4 text-lg font-bold text-foreground">Post Settings</h3>
                <MetadataForm
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
      </div>

      <ConfirmDialog
        open={showRestore}
        title="Restore Draft?"
        message={
          existingDraft
            ? `A Draft was found on this device, saved ${formatDraftAge(existingDraft.savedAt)}. Restore it, or discard it and keep what's already here?`
            : "A Draft was found on this device. Restore it, or discard it and keep what's already here?"
        }
        confirmText="Restore"
        cancelText="Discard"
        initialFocus="confirm"
        onConfirm={applyRestore}
        onCancel={discardRestore}
      />

      <ConfirmDialog
        open={showBackConfirm}
        title="Leave without saving?"
        message="You have unsaved changes. If you leave now, they will be lost."
        confirmText="Leave"
        cancelText="Stay"
        danger
        onConfirm={confirmBack}
        onCancel={() => setShowBackConfirm(false)}
      />

      <PublishSheet
        open={publishSheetOpen}
        onClose={() => setPublishSheetOpen(false)}
        category={category}
        onCategoryChange={setCategory}
        status={status}
        onStatusChange={setStatus}
        checklist={publishChecklist}
        confirmLabel={publishConfirmLabel}
        pending={saving}
        onConfirm={handlePublishConfirm}
      />
    </div>
  );
}
