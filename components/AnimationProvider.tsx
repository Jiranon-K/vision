"use client";

import React, { useEffect, useRef } from "react";
import { set, createTimeline } from "animejs";
import { usePathname } from "next/navigation";

interface AnimationProviderProps {
  children: React.ReactNode;
}

const AnimationProvider = ({ children }: AnimationProviderProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!overlayRef.current || !innerRef.current) return;
    set(overlayRef.current, { scaleX: 1 });
    set(innerRef.current, { opacity: 0 });

    const tl = createTimeline();

    tl.add(overlayRef.current, {
      scaleX: [1, 0],
      transformOrigin: "right center",
      duration: 1000,
      easing: "easeInOutExpo",
      delay: 100,
    });

    tl.add(
      innerRef.current,
      {
        opacity: [0, 1],
        duration: 600,
        easing: "easeOutCubic",
      },
      "-=500",
    );
  }, [pathname]);

  return (
    <>
      {/* Intro overlay — brand-lime sweep */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-brand-lime z-[9999] pointer-events-none"
        style={{ transformOrigin: "right center" }}
      />
      <div ref={innerRef} className="opacity-0">
        {children}
      </div>
    </>
  );
};

export default AnimationProvider;
