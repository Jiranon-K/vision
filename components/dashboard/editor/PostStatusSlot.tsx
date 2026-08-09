"use client";

import { useEffect, useRef, useState } from "react";
import { animate, set } from "animejs";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { DURATION_SLOW, EASE_OUT } from "@/lib/motion";
import { Badge } from "@/components/ui/badge";

export interface PostStatusSlotProps {
  status: "Draft" | "Published";
  className?: string;
}

// Draft -> Published is the one status change with consequences outside this
// screen (ticket 04), so it crossfades instead of just re-rendering. The
// outgoing label is kept mounted just long enough to fade under the
// incoming one; reduced motion skips straight to the new label; the "brief"
// half of that experience — the accent rule — lives in EditorTopBar.
export default function PostStatusSlot({ status, className = "" }: PostStatusSlotProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const prevStatus = useRef(status);
  const isFirstRender = useRef(true);
  const [outgoing, setOutgoing] = useState<"Draft" | "Published" | null>(null);
  const outgoingRef = useRef<HTMLSpanElement>(null);
  const incomingRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevStatus.current = status;
      return;
    }
    if (prevStatus.current === status) return;
    const from = prevStatus.current;
    prevStatus.current = status;

    if (prefersReducedMotion) return;

    setOutgoing(from);
    const outgoingEl = outgoingRef.current;
    const incomingEl = incomingRef.current;
    if (outgoingEl) animate(outgoingEl, { opacity: [1, 0], duration: DURATION_SLOW, ease: EASE_OUT });
    if (incomingEl) {
      set(incomingEl, { opacity: 0 });
      animate(incomingEl, { opacity: [0, 1], duration: DURATION_SLOW, ease: EASE_OUT });
    }
    const timer = window.setTimeout(() => setOutgoing(null), DURATION_SLOW);
    return () => window.clearTimeout(timer);
  }, [status, prefersReducedMotion]);

  return (
    <Badge
      tone={status === "Published" ? "brand" : "neutral"}
      appearance={status === "Published" ? "solid" : "subtle"}
      size="sm"
      className={`relative shrink-0 ${className}`}
      aria-live="polite"
    >
      <span className="relative inline-block">
        {outgoing && (
          <span ref={outgoingRef} aria-hidden="true" className="absolute inset-0">
            {outgoing}
          </span>
        )}
        <span ref={incomingRef}>{status}</span>
      </span>
    </Badge>
  );
}
