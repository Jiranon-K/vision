"use client";

import React, { useEffect, useRef } from "react";
import { set, createTimeline } from "animejs";

interface AnimationProviderProps {
  children: React.ReactNode;
}

const AnimationProvider = ({ children }: AnimationProviderProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!overlayRef.current || !contentRef.current) return;
    set(contentRef.current, { opacity: 0, translateY: 16 });

    const tl = createTimeline();

    tl.add(overlayRef.current, {
      scaleX: [1, 0],
      transformOrigin: "right center",
      duration: 900,
      delay: 120,
    });

    tl.add(
      contentRef.current,
      {
        opacity: [0, 1],
        translateY: [16, 0],
        duration: 700,
        easing: "easeOutCubic",
      },
      "-=500",
    );
  }, []);

  return (
    <>
      {/* Intro overlay — brand-lime sweep */}
      <div
        ref={overlayRef}
        style={{ transformOrigin: "right center" }}
        className="fixed inset-0 bg-brand-lime z-[9999] pointer-events-none"
      />
      <div ref={contentRef} className="opacity-0">
        {children}
      </div>
    </>
  );
};

export default AnimationProvider;
