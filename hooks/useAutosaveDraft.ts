"use client";

import { useEffect, useRef, useState } from "react";

export interface PostDraft {
  title: string;
  content: string;
  category: string;
  status: "Draft" | "Published";
  excerpt: string;
  coverImage: string;
  savedAt: number;
}

export type PostDraftState = Omit<PostDraft, "savedAt">;

interface UseAutosaveDraftOptions {
  enabled?: boolean;
  debounceMs?: number;
}

interface UseAutosaveDraftReturn {
  existingDraft: PostDraft | null;
  clearDraft: () => void;
}

export function draftKey(id?: string): string {
  return `post-draft:${id ?? "new"}`;
}

// Debounced autosave of editor state to localStorage so work survives an
// accidental reload/close. The page reads `existingDraft` (captured once on
// mount) to offer a restore prompt, and calls `clearDraft()` after a successful
// save. `now` is injected so the hook stays pure/testable.
export function useAutosaveDraft(
  key: string,
  state: PostDraftState,
  { enabled = true, debounceMs = 800 }: UseAutosaveDraftOptions = {},
): UseAutosaveDraftReturn {
  // Read any pre-existing draft once, lazily (avoids setState-in-effect and SSR
  // localStorage access). Captured at mount; the page decides whether to restore.
  const [existingDraft, setExistingDraft] = useState<PostDraft | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as PostDraft) : null;
    } catch {
      return null;
    }
  });
  const skipFirstWrite = useRef(true);

  // Debounced write. Skip the very first run so freshly loaded server data isn't
  // immediately re-persisted as a "draft".
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    if (skipFirstWrite.current) {
      skipFirstWrite.current = false;
      return;
    }

    const handle = window.setTimeout(() => {
      try {
        const draft: PostDraft = { ...state, savedAt: Date.now() };
        window.localStorage.setItem(key, JSON.stringify(draft));
      } catch {
        // Quota/serialization failure — drop silently.
      }
    }, debounceMs);

    return () => window.clearTimeout(handle);
  }, [key, enabled, debounceMs, state]);

  const clearDraft = () => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
    setExistingDraft(null);
  };

  return { existingDraft, clearDraft };
}
