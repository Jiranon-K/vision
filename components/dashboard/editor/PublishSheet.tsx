"use client";

import { useEffect, useId, useRef } from "react";
import { animate, set, cubicBezier } from "animejs";
import { categories } from "@/lib/constants";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export interface PublishChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface PublishSheetProps {
  open: boolean;
  onClose: () => void;
  category: string;
  onCategoryChange: (category: string) => void;
  status: "Draft" | "Published";
  onStatusChange: (status: "Draft" | "Published") => void;
  /** What still stands between this Post and Publishing, in the Creator's
   *  own terms — shown plainly rather than left for a disabled button to
   *  imply (ticket 04). */
  checklist: PublishChecklistItem[];
  confirmLabel: string;
  pending: boolean;
  onConfirm: () => void;
}

// Mirrors --duration-slow / --ease-out from app/globals.css — see
// ConfirmDialog for why the value, not the token name, is duplicated here.
const ENTRANCE_DURATION = 300;
const ENTRANCE_EASE = cubicBezier(0.16, 1, 0.3, 1);

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Publish opens this rather than firing a request directly (ticket 04): the
// two things that gate Publishing — Category and Draft/Published — live
// here, next to the checklist that explains why the confirm might still be
// unreachable. Confirming always persists the Post with whatever this sheet
// currently holds; PostEditorForm decides from the status transition alone
// whether that counts as "Publish" for the top bar's animation.
export default function PublishSheet({
  open,
  onClose,
  category,
  onCategoryChange,
  status,
  onStatusChange,
  checklist,
  confirmLabel,
  pending,
  onConfirm,
}: PublishSheetProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const categoryId = useId();

  const canConfirm = checklist.every((item) => item.done) && !pending;

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const panel = panelRef.current;
    if (panel) {
      if (prefersReducedMotion) {
        set(panel, { opacity: 0, translateX: 0 });
        animate(panel, { opacity: [0, 1], duration: ENTRANCE_DURATION, ease: ENTRANCE_EASE });
      } else {
        set(panel, { translateX: "100%" });
        animate(panel, { translateX: ["100%", "0%"], duration: ENTRANCE_DURATION, ease: ENTRANCE_EASE });
      }
    }

    closeRef.current?.focus();

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panel) return;

      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeydown);

    return () => {
      document.removeEventListener("keydown", handleKeydown);
      // Sends focus back to whatever opened the sheet — usually the Publish
      // control in the top bar — rather than stranding it at the document root.
      previouslyFocused.current?.focus();
    };
  }, [open, onClose, prefersReducedMotion]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-surface-inverse/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex h-full w-full max-w-md flex-col gap-6 overflow-y-auto border-l-2 border-border-strong bg-surface p-6 opacity-0 shadow-panel"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-xl font-black text-foreground">
            Publish
          </h2>
          <Button ref={closeRef} type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </Button>
        </div>

        <div>
          <Label htmlFor={categoryId} className="mb-2">
            Category
          </Label>
          <select
            id={categoryId}
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full rounded-xl border-2 border-border-strong bg-surface px-4 py-3 font-medium text-foreground focus:outline-none"
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
        </div>

        <div>
          <span className="mb-2 block text-sm font-bold text-foreground">Draft or Published</span>
          <div role="radiogroup" aria-label="Draft or Published" className="grid grid-cols-2 gap-3">
            {(["Draft", "Published"] as const).map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={status === option}
                onClick={() => onStatusChange(option)}
                className={`rounded-xl border-2 border-border-strong px-4 py-3 text-center font-bold transition-colors ${
                  status === option
                    ? "bg-accent text-accent-foreground"
                    : "bg-surface text-foreground hover:bg-state-hover"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-text-secondary">
            {status === "Published"
              ? "Published Posts are visible to Readers on the public blog."
              : "Draft Posts are not visible to Readers."}
          </p>
        </div>

        <div>
          <span className="mb-2 block text-sm font-bold text-foreground">Before you publish</span>
          <ul className="space-y-2">
            {checklist.map((item) => (
              <li key={item.id} className="flex items-center gap-2 text-sm">
                <span
                  aria-hidden="true"
                  className={`flex size-5 shrink-0 items-center justify-center rounded-pill border-2 ${
                    item.done
                      ? "border-success-strong bg-success-subtle text-success-strong"
                      : "border-border text-text-faint"
                  }`}
                >
                  {item.done ? (
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 8L6.5 11.5L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : null}
                </span>
                <span className={item.done ? "text-text-secondary" : "text-foreground"}>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-auto flex gap-3 pt-2">
          <Button type="button" variant="outline" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            fullWidth
            disabled={!canConfirm}
            loading={pending}
            loadingText="Saving..."
            onClick={onConfirm}
            // The design's press feedback ("translate toward its shadow
            // offset, shadow to none on activation") normally only fires on
            // hover — this is the one control the ticket calls out by name,
            // so it gets the same feedback on :active too, for touch and for
            // a keyboard Enter press that never hovers.
            className="active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
