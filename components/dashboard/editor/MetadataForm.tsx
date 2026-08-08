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
      <div>
        <label className="mb-2 block text-sm font-medium text-text-secondary">
          Cover Image
        </label>
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-border-strong bg-surface-muted">
            {coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element -- previews a cover URL the Creator just typed, which next/image cannot optimize without a configured host
              <img
                src={coverImage}
                alt="Cover preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xs text-text-faint">No image</span>
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
            <Button
              type="button"
              size="sm"
              className="w-fit"
              onClick={() => fileInputRef.current?.click()}
            >
              {coverImage ? "Change Image" : "Upload Image"}
            </Button>
            {coverImage && (
              <button
                type="button"
                onClick={() => {
                  onCoverImageChange("");
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="w-fit text-sm font-medium text-error-strong hover:underline"
              >
                Remove
              </button>
            )}
            <p className="text-xs text-text-faint">
              JPG, PNG or GIF. Max 2MB.
            </p>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="block text-sm font-medium text-text-secondary">
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
        <p className="mt-1 text-right text-xs text-text-faint">
          {excerpt.length}/500
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
