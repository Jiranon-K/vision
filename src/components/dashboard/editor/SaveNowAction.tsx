"use client";

import { Button } from "@/components/ui/button";

export interface SaveNowActionProps {
  /** Shown only while there is something to save — withdraws the instant
   *  the Post on the server matches what is on screen. */
  visible: boolean;
  saving: boolean;
  onClick: () => void;
}

// The bar's one save control (ticket 04's requirement that a Draft is never
// persisted by the button that publishes it, in the shape the design gives
// it): a quiet ghost that appears beside Publish while the Creator is ahead
// of the server, and withdraws when they are not. `ghost` is the quietest
// variant the design system has, which keeps it subordinate to Publish —
// the one control on this bar with consequences off the screen.
//
// It stays mounted and reserves its width while hidden, so Publish never
// shifts sideways when this withdraws.
export default function SaveNowAction({ visible, saving, onClick }: SaveNowActionProps) {
  return (
    <div className="w-24 shrink-0">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        fullWidth
        onClick={onClick}
        loading={saving}
        loadingText="Saving…"
        tabIndex={visible ? 0 : -1}
        aria-hidden={!visible}
        className={`transition-opacity ${visible ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        Save now
      </Button>
    </div>
  );
}
