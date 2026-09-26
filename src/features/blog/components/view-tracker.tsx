"use client";

import { useEffect } from "react";
import { incrementPostViews } from "../api";

// Fire-and-forget view ping on mount. In dev, React Strict Mode may invoke this
// twice; in production it runs once per page load.
//
// A Delivery links here with `?from=delivery`, which is how Growth Analytics
// tells a read from a Follower's inbox apart from any other. Read from the
// location rather than props so the page itself stays cacheable.
export default function ViewTracker({ id }: { id: string }) {
  useEffect(() => {
    const fromDelivery = new URLSearchParams(window.location.search).get("from") === "delivery";
    incrementPostViews(id, fromDelivery ? "delivery" : undefined);
  }, [id]);

  return null;
}
