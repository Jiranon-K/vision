"use client";

import { useEffect } from "react";
import { incrementPostViews } from "@/lib/posts";

// Fire-and-forget view ping on mount. In dev, React Strict Mode may invoke this
// twice; in production it runs once per page load.
export default function ViewTracker({ id }: { id: string }) {
  useEffect(() => {
    incrementPostViews(id);
  }, [id]);

  return null;
}
