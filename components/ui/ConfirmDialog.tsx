"use client";

import { useEffect, useRef } from "react";
import { animate } from "animejs";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
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
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const didAnimate = useRef(false);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    didAnimate.current = false;
    animate(dialog, {
      opacity: [0, 1],
      scale: [0.9, 1],
      duration: 200,
      easing: "easeOutCubic",
    });
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      
      <div
        ref={dialogRef}
        className="relative bg-white rounded-[20px] border-2 border-brand-dark p-6 w-full max-w-md shadow-[4px_4px_0px_0px_#191A23] opacity-0"
      >
        <h3 className="text-xl font-black text-brand-dark mb-2">{title}</h3>
        <p className="text-brand-dark/70 mb-6">{message}</p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-brand-gray border-2 border-brand-dark/20 rounded-[12px] font-bold text-brand-dark/70 hover:border-brand-dark hover:text-brand-dark transition-all duration-200"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 border-2 border-brand-dark rounded-[12px] font-bold shadow-[4px_4px_0px_0px_#191A23] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all duration-200 ${
              danger
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-brand-lime text-brand-dark"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
