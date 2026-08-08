"use client";

import { Button } from "@/components/ui/button";

export interface SaveNowActionProps {
  /** Shown only while the local autosave buffer differs from its last
   *  commit — withdraws the instant there is nothing left to save. */
  visible: boolean;
  onClick: () => void;
}

// A quiet escape hatch beside PublishAction — ticket 03. `ghost` is the
// quietest variant the design system has, which is what keeps this reading
// as subordinate to PublishAction's `secondary` (the one control on the bar
// with a real effect on the Post). Stays mounted and reserves its own width
// even while hidden, so PublishAction never shifts when this withdraws.
export default function SaveNowAction({ visible, onClick }: SaveNowActionProps) {
  return (
    <div className="w-24 shrink-0">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        fullWidth
        onClick={onClick}
        tabIndex={visible ? 0 : -1}
        aria-hidden={!visible}
        className={`transition-opacity ${visible ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        Save now
      </Button>
    </div>
  );
}
