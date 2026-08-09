"use client";

import { useEffect, useRef } from "react";
import { animate, set } from "animejs";
import { Button } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { DURATION_BASE, EASE_OUT } from "@/lib/motion";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
  /** Which control takes initial focus on open. Defaults to "cancel" — the
   *  safe option — so a Creator hitting Enter on reflex lands on the choice
   *  that can't lose anything. */
  initialFocus?: "confirm" | "cancel";
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  danger = false,
  initialFocus = "cancel",
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  // Whatever had focus before the dialog opened — restored on close so
  // dismissing a dialog never strands focus at the top of the document.
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const dialog = dialogRef.current;
    if (dialog) {
      if (prefersReducedMotion) {
        // Fades with no scale — a real reduced-motion state, not just a
        // shorter version of the full animation.
        set(dialog, { opacity: 0, scale: 1 });
        animate(dialog, { opacity: [0, 1], duration: DURATION_BASE, ease: EASE_OUT });
      } else {
        animate(dialog, {
          opacity: [0, 1],
          scale: [0.95, 1],
          duration: DURATION_BASE,
          ease: EASE_OUT,
        });
      }
    }

    (initialFocus === "confirm" ? confirmRef.current : cancelRef.current)?.focus();

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      onCancel();
    };
    document.addEventListener("keydown", handleKeydown);

    return () => {
      document.removeEventListener("keydown", handleKeydown);
      previouslyFocused.current?.focus();
    };
  }, [open, initialFocus, onCancel, prefersReducedMotion]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-surface-inverse/40 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        className="relative w-full max-w-md rounded-2xl border-2 border-border-strong bg-surface p-6 shadow-panel opacity-0"
      >
        <h3 id="confirm-dialog-title" className="mb-2 text-xl font-black text-foreground">
          {title}
        </h3>
        <p id="confirm-dialog-message" className="mb-6 text-text-secondary">
          {message}
        </p>

        <div className="flex gap-3">
          <Button ref={cancelRef} variant="outline" fullWidth onClick={onCancel}>
            {cancelText}
          </Button>
          <Button
            ref={confirmRef}
            variant={danger ? "destructive" : "secondary"}
            fullWidth
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
