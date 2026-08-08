"use client";

import { useEffect, useState } from "react";

// Same shape as usePrefersReducedMotion — SSR-safe default, live updates via
// the same matchMedia listener pattern, so any width-based decision (like
// whether Split has room to survive) stays a single reusable primitive.
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    // A changed `query` prop needs its current match synced in, but a
    // timer (delay 0) keeps this out of "setState synchronously in an
    // effect body" rather than calling setMatches directly here.
    const syncTimer = window.setTimeout(() => setMatches(mql.matches), 0);
    const handleChange = (e: MediaQueryListEvent) => setMatches(e.matches);

    mql.addEventListener("change", handleChange);
    return () => {
      window.clearTimeout(syncTimer);
      mql.removeEventListener("change", handleChange);
    };
  }, [query]);

  return matches;
}
