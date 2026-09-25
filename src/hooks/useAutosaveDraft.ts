"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
  /** When the last commit landed, or null if none has landed this session
   *  (or a resumed one, via `existingDraft.savedAt`). Ticket 03 reads this
   *  to decide between "New Post" and "Autosaved". */
  lastSavedAt: number | null;
  /** True from the moment `state` changes until the next commit lands —
   *  the buffer has diverged from what's on disk. Ticket 03's "Writing". */
  dirty: boolean;
  /** True only while a commit is actually being written — Ticket 03's
   *  "Saving". Deliberately spans a brief timer (see `commit` below) rather
   *  than collapsing into the same render as the write, so the state is
   *  perceivable. */
  saving: boolean;
  /** Skips the debounce and commits `state` immediately. Cancels any
   *  pending debounced commit first, so it can't double-write. */
  saveNow: () => void;
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
  // The last `state` the debounce effect actually treated as a baseline
  // (i.e. not a change worth saving) — see the effect below for why this
  // has to be state comparison rather than a plain "have I run before" flag.
  const baselineState = useRef<PostDraftState | null>(null);

  // A prior session's commit still counts as "saved" — the chip must not
  // claim "New Post" for a draft that already exists on disk.
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(
    () => existingDraft?.savedAt ?? null,
  );
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // `saveNow` needs the freshest `state` outside of the debounce effect's
  // own closure, and needs to cancel whatever that effect last scheduled.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  const pendingTimeout = useRef<number | undefined>(undefined);
  // Bumped on every commit() call so a stale rAF chain (e.g. saveNow fired
  // while a debounced commit's frames were still pending) can tell it's no
  // longer the latest and skip writing on top of a newer one.
  const commitToken = useRef(0);

  const commit = useCallback(() => {
    if (typeof window === "undefined") return;
    window.clearTimeout(pendingTimeout.current);
    pendingTimeout.current = undefined;

    const token = ++commitToken.current;
    setSaving(true);
    // A short setTimeout, not requestAnimationFrame — the write must still
    // land if the Creator has switched tabs while it was pending, and
    // browsers throttle (or fully suspend) rAF in a backgrounded tab. The
    // delay only needs to separate this from `setSaving(true)` into its own
    // task, so the two don't batch into one render and the Saving state
    // never becomes visible.
    window.setTimeout(() => {
      if (commitToken.current !== token) return;
      try {
        const draft: PostDraft = { ...stateRef.current, savedAt: Date.now() };
        window.localStorage.setItem(key, JSON.stringify(draft));
        setLastSavedAt(draft.savedAt);
        setDirty(false);
      } catch {
        // Quota/serialization failure — drop silently.
      } finally {
        setSaving(false);
      }
    }, 120);
  }, [key]);

  // Debounced write. Skips the first *real* run so freshly loaded server
  // data isn't immediately re-persisted as a "draft" — deliberately
  // comparing `state` against the last baseline rather than latching a
  // boolean on "has this effect run before": React's Strict Mode replays
  // an initial mount's effects (mount → cleanup → mount) before any state
  // has actually changed, and a boolean latch flips permanently on that
  // first replay, making every subsequent render (including the real first
  // keystroke) look like a follow-up write instead of the baseline. Diffing
  // against `state` itself is immune to how many times the effect happens
  // to run for the same content.
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    if (baselineState.current === null) {
      baselineState.current = state;
      return;
    }
    if (state === baselineState.current) {
      return;
    }
    baselineState.current = state;

    setDirty(true);

    const handle = window.setTimeout(() => {
      commit();
    }, debounceMs);
    pendingTimeout.current = handle;

    return () => window.clearTimeout(handle);
  }, [key, enabled, debounceMs, state, commit]);

  const saveNow = useCallback(() => {
    if (!enabled) return;
    commit();
  }, [enabled, commit]);

  const clearDraft = () => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
    setExistingDraft(null);
    // Nothing is saved anymore — the chip must fall back to whatever else
    // it knows (e.g. the Post's own server-side last-saved time), not keep
    // reporting a commit that was just discarded.
    setLastSavedAt(null);
    setDirty(false);
  };

  return { existingDraft, clearDraft, lastSavedAt, dirty, saving, saveNow };
}
