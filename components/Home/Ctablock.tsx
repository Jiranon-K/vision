"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { animate } from "animejs";

const Ctablock = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const didAnimate = useRef(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !didAnimate.current) {
            didAnimate.current = true;

            if (textRef.current) {
              animate(Array.from(textRef.current.children), {
                opacity: [0, 1],
                translateY: [28, 0],
                delay: (_, i) => i * 110,
                duration: 650,
                easing: "easeOutCubic",
              });
            }

            if (imageRef.current) {
              animate(imageRef.current, {
                opacity: [0, 1],
                translateX: [32, 0],
                duration: 800,
                delay: 200,
                easing: "easeOutExpo",
              });
            }

            observer.disconnect();
          }
        });
      },
      { threshold: 0.2 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="container mx-auto px-4 py-16 md:py-24">
      <div className="bg-brand-gray rounded-[3rem] p-10 md:p-14 relative flex flex-col md:flex-row items-center justify-between min-h-[350px]">
        {/* Text Content */}
        <div
          ref={textRef}
          className="flex-1 space-y-7 z-10 text-center md:text-left"
        >
          <h2 className="text-3xl md:text-4xl font-semibold text-brand-dark leading-tight opacity-0">
            Ready to share your vision?
          </h2>
          <p className="text-lg text-brand-dark max-w-md mx-auto md:mx-0 font-light leading-relaxed opacity-0">
            Connect with experts and enthusiasts. Post your insights, engage
            with readers, and grow your digital influence with our powerful
            sharing tools.
          </p>
          <div className="opacity-0">
            <button className="bg-brand-dark text-white px-10 py-5 rounded-2xl text-xl font-medium hover:bg-brand-lime hover:text-brand-dark transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg">
              Join the community
            </button>
          </div>
        </div>

        {/* Image — slides in from right */}
        <div
          ref={imageRef}
          className="hidden md:flex flex-1 justify-end relative h-full opacity-0"
        >
          <div className="absolute -right-10 -top-48 lg:right-0 lg:-top-64">
            <Image
              src="/as-02.png"
              alt="CTA Illustration"
              width={500}
              height={500}
              className="object-contain"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Ctablock;
