"use client";

import { Button } from "@/components/ui/button";

export interface SaveActionProps {
  saving: boolean;
  onClick: () => void;
}

// Ticket 04's answer to the accident the ticket forbids: once Publish opens
// a sheet instead of saving directly, nothing else persists a Draft to the
// server. This is that something — a plain, always-available save that
// writes the Post exactly as it stands, status untouched. It is a distinct
// control from Publish (never the same button pressed twice) and from
// SaveNowAction (that one only forces the local autosave commit). `outline`
// carries no --elevation-hard: this action is reversible and non-modal, so
// the hard shadow — reserved for Publish and the sheet's confirm — doesn't
// belong here.
export default function SaveAction({ saving, onClick }: SaveActionProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      loading={saving}
      loadingText="Saving..."
    >
      Save
    </Button>
  );
}
