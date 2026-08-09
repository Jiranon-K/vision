"use client";

import { useEffect, useRef, useState } from "react";
import { animate, set, cubicBezier } from "animejs";
import { toast } from "sonner";
import { apiFetch, authFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import type { MetadataFormProps } from "./types";

// Below this, a "summary" would just echo the content back — the button stays
// visible but disabled rather than firing a request that can't say anything.
const MIN_SUGGESTION_CONTENT_LENGTH = 40;

// Mirrors --duration-base / --ease-out from app/globals.css — animejs
// animates DOM properties directly and can't read CSS custom properties, so
// the token's *value* is duplicated here rather than its name.
const SUGGESTION_DURATION = 200;
const SUGGESTION_EASE = cubicBezier(0.16, 1, 0.3, 1);

// The border flash itself is a CSS `transition-colors` (bound to
// --duration-slow via the arbitrary-value class below), not something this
// file drives frame by frame — only the hold before it reverts lives here,
// and reduced motion reuses the exact same hold to swap instantly instead.
const BORDER_FLASH_HOLD_MS = 600;

export default function MetadataForm({
  coverImage,
  onCoverImageChange,
  excerpt,
  onExcerptChange,
  content,
  postId,
}: MetadataFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const excerptFieldRef = useRef<HTMLTextAreaElement>(null);
  const fallbackAlertRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  // Single source of truth for whether this deployment has the capability at
  // all lives on the server (it holds the credentials) — never a
  // NEXT_PUBLIC_* flag that could drift from what's actually configured.
  const [suggestionAvailable, setSuggestionAvailable] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [confirmingReplace, setConfirmingReplace] = useState(false);
  // Drives the field's border flash on arrival — a held state (see
  // BORDER_FLASH_HOLD_MS), not a running animation.
  const [borderFlash, setBorderFlash] = useState(false);
  // A derived fallback (source === "fallback") gets a durable Alert instead
  // of the toast this used to fire: a toast reporting "the AI part of this
  // didn't happen" can vanish before the Creator reads it, and the field it's
  // about is still sitting right there. Kept as the *only* channel for that
  // message so it isn't said twice.
  const [showFallbackAlert, setShowFallbackAlert] = useState(false);

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

  // Reverts the border flash after its hold — full motion eases the change
  // back via the field's own `transition-colors`; reduced motion has no
  // transition class, so the same timeout instead holds the flash as a
  // static state before it swaps back instantly.
  useEffect(() => {
    if (!borderFlash) return;
    const timer = window.setTimeout(() => setBorderFlash(false), BORDER_FLASH_HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [borderFlash]);

  useEffect(() => {
    if (!showFallbackAlert) return;
    const el = fallbackAlertRef.current;
    if (!el) return;
    if (prefersReducedMotion) {
      set(el, { opacity: 1, translateY: 0 });
    } else {
      set(el, { opacity: 0, translateY: -8 });
      animate(el, {
        opacity: [0, 1],
        translateY: [-8, 0],
        duration: SUGGESTION_DURATION,
        ease: SUGGESTION_EASE,
      });
    }
  }, [showFallbackAlert, prefersReducedMotion]);

  const contentTooShort = content.trim().length < MIN_SUGGESTION_CONTENT_LENGTH;

  // The Creator did not type this text, so its arrival has to be legible:
  // the field's content fades up from a small offset while its border
  // flashes the brand line. Reduced motion swaps the content instantly and
  // still flashes the border, just without the eased transition.
  const animateSuggestionArrival = () => {
    const field = excerptFieldRef.current;
    if (field) {
      if (prefersReducedMotion) {
        set(field, { opacity: 1, translateY: 0 });
      } else {
        set(field, { opacity: 0, translateY: 8 });
        animate(field, {
          opacity: [0, 1],
          translateY: [8, 0],
          duration: SUGGESTION_DURATION,
          ease: SUGGESTION_EASE,
        });
      }
    }
    setBorderFlash(true);
  };

  const runSuggest = async () => {
    setSuggesting(true);
    try {
      const res = await authFetch("/api/posts/suggest-excerpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postId ? { content, postId } : { content }),
      });

      if (res.status === 429) {
        toast.error("You've asked too often — try again in a bit.");
        return;
      }
      if (!res.ok) {
        toast.error("Couldn't suggest an excerpt right now.");
        return;
      }

      const data = await res.json();
      onExcerptChange(data.excerpt);
      animateSuggestionArrival();
      // "fallback": the provider failed or timed out server-side, so the
      // field holds a mechanically derived excerpt. Saying so is the point —
      // never pass a truncation off as the AI's work.
      if (data.source === "fallback") {
        setShowFallbackAlert(true);
      } else {
        setShowFallbackAlert(false);
        toast.success("Excerpt suggestion added — edit it as you like.");
      }
    } finally {
      setSuggesting(false);
    }
  };

  const handleSuggest = () => {
    // An empty field has nothing to lose; replacing text the Creator wrote does.
    if (excerpt.trim()) {
      setConfirmingReplace(true);
      return;
    }
    void runSuggest();
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
      <div className="flex flex-col gap-2">
        <span className="text-sm font-bold text-foreground">Cover image</span>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleCoverChange}
          accept="image/*"
          className="hidden"
        />

        {/* Empty is the common case, so empty gets the whole slot: a dashed
            well on the sunken surface, sized to be aimed at rather than a
            button beside a placeholder box. */}
        {coverImage ? (
          <div className="flex flex-col gap-2">
            <div className="overflow-hidden rounded-xl border-2 border-border-strong bg-surface-muted">
              {/* eslint-disable-next-line @next/next/no-img-element -- previews a cover URL the Creator just chose, which next/image cannot optimize without a configured host */}
              <img src={coverImage} alt="Cover preview" className="h-28 w-full object-cover" />
            </div>
            <div className="flex items-center gap-3">
              <Button type="button" size="sm" onClick={() => fileInputRef.current?.click()}>
                Change
              </Button>
              <button
                type="button"
                onClick={() => {
                  onCoverImageChange("");
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-sm font-medium text-error-strong hover:underline"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-surface-sunken px-4 py-[22px] text-center text-text-muted transition-colors hover:bg-state-hover"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="opacity-50"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            <span className="text-xs leading-normal">
              Drop an image or browse — JPG, PNG, GIF, max 2&nbsp;MB
            </span>
          </button>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <label className="block text-sm font-bold text-foreground">
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
              className="flex items-center gap-1.5 rounded-pill border-2 border-border-strong bg-surface px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-state-hover disabled:cursor-not-allowed disabled:opacity-[var(--state-disabled-opacity)] disabled:hover:bg-surface"
            >
              {suggesting && <Spinner size="sm" label={null} />}
              {suggesting ? "Suggesting…" : "Suggest Excerpt"}
            </button>
          )}
        </div>
        <textarea
          ref={excerptFieldRef}
          value={excerpt}
          onChange={(e) => onExcerptChange(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Leave blank to generate automatically from the content"
          className={cn(
            "w-full resize-none rounded-xl border-2 bg-surface px-4 py-3 text-sm leading-relaxed text-foreground placeholder:text-text-faint",
            borderFlash ? "border-brand-border" : "border-border-strong",
            !prefersReducedMotion &&
              "transition-colors duration-[var(--duration-slow)] ease-[var(--ease-out)]"
          )}
        />
        {/* Says what the field is for, not just how full it is — the Excerpt
            is the Post's meta description, and nothing else on this screen
            tells the Creator that. */}
        <p className="mt-1 text-xs leading-normal text-text-muted">
          {excerpt.length}/500 · shown in search results and on the blog index
        </p>
        {showFallbackAlert && (
          <Alert ref={fallbackAlertRef} tone="warning" className="mt-3">
            AI suggestions are unavailable right now — this excerpt was generated from your content instead.
          </Alert>
        )}
      </div>

      <ConfirmDialog
        open={confirmingReplace}
        title="Replace Excerpt?"
        message="Asking for a new suggestion will replace the excerpt you have already written."
        confirmText="Replace"
        cancelText="Keep mine"
        onConfirm={() => {
          setConfirmingReplace(false);
          void runSuggest();
        }}
        onCancel={() => setConfirmingReplace(false)}
      />
    </div>
  );
}
