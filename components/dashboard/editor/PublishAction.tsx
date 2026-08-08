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
export default function PublishAction({ onClick }: PublishActionProps) {
  return (
    <Button type="button" variant="secondary" size="sm" onClick={onClick}>
      <svg
        width="18"
        height="18"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4 4V16H16V7L12 3H4Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 3V7H16"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Publish
    </Button>
  );
}
