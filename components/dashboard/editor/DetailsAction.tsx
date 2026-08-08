"use client";

import { Button } from "@/components/ui/button";

export interface DetailsActionProps {
  onClick: () => void;
}

// Ticket 05: opens the details drawer (cover image + Excerpt) in one
// gesture from the bar. Unlike Save/Publish this stays visible even for a
// Creator without edit rights — the drawer's fields go `inert` along with
// the rest of the writing surface, but there's nothing wrong with looking.
export default function DetailsAction({ onClick }: DetailsActionProps) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick}>
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="4" width="14" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="7.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 13.5L7 10L10 12.5L13 9L17 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Details
    </Button>
  );
}
