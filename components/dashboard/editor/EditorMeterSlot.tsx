"use client";

export interface EditorMeterSlotProps {
  className?: string;
}

// Empty by design. Ticket 03 ("Autosave stops being invisible") fills this
// with the word count / reading time meter, next to the autosave chip.
export default function EditorMeterSlot() {
  return null;
}
