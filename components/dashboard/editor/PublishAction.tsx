"use client";

import { Button } from "@/components/ui/button";

export interface PublishActionProps {
  label: string;
  pending: boolean;
  disabled: boolean;
  onClick: () => void;
}

// Named for what ticket 04 ("Publishing becomes a decision") turns this
// into — a control that opens the Publish slide-over. Until that lands, it
// keeps today's behaviour exactly: it saves the Post, full stop. `secondary`
// carries --elevation-hard because this is the one control on the bar whose
// press has a real effect on the Post.
export default function PublishAction({
  label,
  pending,
  disabled,
  onClick,
}: PublishActionProps) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      loading={pending}
      loadingText="Saving..."
    >
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
      {label}
    </Button>
  );
}
