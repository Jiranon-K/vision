"use client";

export interface AutosaveStatusSlotProps {
  className?: string;
}

// Empty by design. Ticket 03 ("Autosave stops being invisible") fills this
// with the New/Writing/Saving/Autosaved chip and the commit-pulse animation.
// Owning the file now — even empty — is what lets that ticket land as a
// self-contained change to this file plus a one-line prop addition where
// EditorTopBar renders it.
export default function AutosaveStatusSlot() {
  return null;
}
