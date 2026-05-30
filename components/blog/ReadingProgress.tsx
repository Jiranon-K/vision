"use client";

import { useEffect, useState } from "react";

// Fixed scroll-progress bar. The app makes <body> the scroll container
// (html{overflow:hidden}), so window.scrollY stays 0 — read body.scrollTop and
// listen in the capture phase to catch scroll events from the body element.
export default function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;

    const compute = () => {
      raf = 0;
      const doc = document.documentElement;
      const body = document.body;
      const scrollTop = body.scrollTop || doc.scrollTop || window.scrollY || 0;
      const max =
        (body.scrollHeight || doc.scrollHeight) - window.innerHeight;
      const pct = max > 0 ? (scrollTop / max) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, pct)));
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };

    compute();
    window.addEventListener("scroll", onScroll, {
      capture: true,
      passive: true,
    });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll, {
        capture: true,
      } as EventListenerOptions);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      className="fixed top-0 left-0 right-0 h-1 z-50 pointer-events-none"
      aria-hidden="true"
    >
      <div
        className="h-full bg-brand-lime transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
