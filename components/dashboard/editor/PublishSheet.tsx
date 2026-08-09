"use client";

import { useId } from "react";
import { categories } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
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
const STATUS_COPY = {
  Draft: "Only you can see it.",
  Published: "Live for every Reader.",
} as const;

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
  const categoryLabelId = useId();
  const missing = checklist.filter((item) => !item.done);
  const canConfirm = missing.length === 0 && !pending;

  return (
    <SlideOverPanel
      open={open}
      onClose={onClose}
      title="Publish this Post"
      description="Publishing makes it visible to every Reader. You can move it back to Draft at any time."
      footer={
        <div className="mt-auto pt-2">
          <Button
            type="button"
            variant="secondary"
            size="lg"
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
      <div aria-hidden="true" className="h-px bg-border-subtle" />

      {/* Chips, not a select: there are six Categories, they all fit, and a
          Creator choosing one shouldn't have to open a menu to find out what
          the choices are. */}
      <div className="flex flex-col gap-2">
        <Label id={categoryLabelId} required>
          Category
        </Label>
        <div role="radiogroup" aria-labelledby={categoryLabelId} className="flex flex-wrap gap-2">
          {categories
            .filter((c) => c !== "All")
            .map((cat) => (
              <button
                key={cat}
                type="button"
                role="radio"
                aria-checked={category === cat}
                onClick={() => onCategoryChange(cat)}
                className={`rounded-pill border-2 px-3.5 py-2 text-[13.5px] font-bold transition-colors ${
                  category === cat
                    ? "border-border-strong bg-accent text-accent-foreground"
                    : "border-border bg-transparent text-text-secondary hover:bg-state-hover"
                }`}
              >
                {cat}
              </button>
            ))}
        </div>
      </div>

      {/* "Draft or Published", not the design's "Visibility": those two are
          the words the rest of the product uses for a Post's status
          (CONTEXT.md), and a third name for the same thing is a bug. */}
      <div className="flex flex-col gap-2">
        <span id="publish-status-label" className="text-sm font-bold text-foreground">
          Draft or Published
        </span>
        <div role="radiogroup" aria-labelledby="publish-status-label" className="flex gap-3">
          {(["Draft", "Published"] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={status === option}
              onClick={() => onStatusChange(option)}
              className={`flex flex-1 flex-col gap-1 rounded-xl border-2 p-3.5 text-left transition-colors ${
                status === option
                  ? "border-border-strong bg-state-selected"
                  : "border-border bg-surface hover:bg-state-hover"
              }`}
            >
              <strong className="text-[15px] text-foreground">{option}</strong>
              <span className="text-[13px] leading-snug text-text-secondary">
                {STATUS_COPY[option]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* One line, not a checklist of ticks: what stands between this Post
          and Publishing, said plainly — and it says so whether or not the
          confirm below happens to be reachable. */}
      <Alert tone={missing.length === 0 ? "success" : "warning"}>
        {missing.length === 0
          ? "Everything this Post needs is here."
          : `Still needed: ${missing.map((item) => item.label.toLowerCase()).join(", ")}.`}
      </Alert>
    </SlideOverPanel>
  );
}
