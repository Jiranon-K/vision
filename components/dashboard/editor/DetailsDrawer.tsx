"use client";

import MetadataForm from "./MetadataForm";
import SlideOverPanel from "./SlideOverPanel";
import type { MetadataFormProps } from "./types";

export interface DetailsDrawerProps extends MetadataFormProps {
  open: boolean;
  onClose: () => void;
}

// Ticket 05: cover image and Excerpt shape how a Post is presented, not
// whether it can ship — they live behind their own drawer instead of a
// "Post Settings" card in the writing path, so neither is in peripheral
// view while writing and neither gates Publish.
export default function DetailsDrawer({ open, onClose, ...metadataProps }: DetailsDrawerProps) {
  return (
    <SlideOverPanel open={open} onClose={onClose} title="Details">
      <MetadataForm {...metadataProps} />
    </SlideOverPanel>
  );
}
