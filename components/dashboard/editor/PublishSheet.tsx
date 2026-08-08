"use client";

import { useId } from "react";
import { categories } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import SlideOverPanel from "./SlideOverPanel";

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

// Publish opens this rather than firing a request directly (ticket 04): the
// two things that gate Publishing — Category and Draft/Published — live
// here, next to the checklist that explains why the confirm might still be
// unreachable. Confirming always persists the Post with whatever this sheet
// currently holds; PostEditorForm decides from the status transition alone
// whether that counts as "Publish" for the top bar's animation.
//
// The scrim, focus trap, Escape-to-close, focus restoration, and slide
// entrance all live in SlideOverPanel (ticket 05) — this component owns only
// what's specific to Publishing.
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
  const categoryId = useId();
  const canConfirm = checklist.every((item) => item.done) && !pending;

  return (
    <SlideOverPanel
      open={open}
      onClose={onClose}
      title="Publish"
      footer={
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
      }
    >
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
    </SlideOverPanel>
  );
}
