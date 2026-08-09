"use client";

import { Button } from "@/components/ui/button";

export interface PublishActionProps {
  onClick: () => void;
}

// Ticket 04: Publish no longer saves anything itself — it opens the sheet
// where Category and Draft/Published are actually decided. `secondary`
// still carries --elevation-hard: the design's elevation rule reserves the
// hard shadow for surfaces that do something irreversible or modal, and
// opening that sheet is the modal half of that pair. Ticket 08: a Creator
// who can't save doesn't get this control at all — EditorTopBar simply
// doesn't render it — so there is no `disabled` state to represent here.
// Text only, and the ellipsis is load-bearing: "Publish…" says a sheet
// opens, "Publish" would promise the Post goes live on this press.
export default function PublishAction({ onClick }: PublishActionProps) {
  return (
    <Button type="button" variant="secondary" size="sm" onClick={onClick}>
      {/* Two nodes rather than one plus an appended glyph: the Button lays
          its children out with a gap, which would leave the ellipsis
          floating away from the word. */}
      <span className="hidden sm:inline">Publish…</span>
      <span className="sm:hidden">Publish</span>
    </Button>
  );
}
