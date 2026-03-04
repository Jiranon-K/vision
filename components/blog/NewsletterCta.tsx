"use client";

import { useEffect, useRef } from "react";
import { animate, stagger } from "animejs";

const NewsletterCta = () => {
  const ctaRef = useRef<HTMLElement>(null);
  const didAnimate = useRef(false);

  useEffect(() => {
    const cta = ctaRef.current;
    if (!cta) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !didAnimate.current) {
            didAnimate.current = true;

            animate(cta.querySelectorAll(".cta-anim"), {
              opacity: [0, 1],
              translateY: [30, 0],
              delay: stagger(100),
              duration: 700,
              easing: "easeOutCubic",
            });

            observer.disconnect();
          }
        });
      },
      { threshold: 0.2 },
    );

    observer.observe(cta);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ctaRef}
      className="max-w-7xl mx-auto px-4 md:px-10 lg:px-20 py-20 md:py-28"
    >
      <div className="bg-brand-dark rounded-[32px] p-8 md:p-14 lg:p-20 relative overflow-hidden">
        {/* Decorative lime circle */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-brand-lime/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand-lime/5 rounded-full blur-2xl" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
          <div className="flex-1">
            <h2 className="cta-anim opacity-0 text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
              Never miss an insight
            </h2>
            <p className="cta-anim opacity-0 text-white/50 text-lg max-w-md">
              Get the latest articles, tips, and creator strategies delivered
              straight to your inbox every week.
            </p>
          </div>
          <div className="cta-anim opacity-0 w-full lg:w-auto flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 lg:w-72 bg-white/10 border border-white/10 text-white placeholder:text-white/30 px-6 py-4 rounded-2xl text-base outline-none focus:border-brand-lime/50 transition-colors duration-300"
            />
            <button className="bg-brand-lime text-brand-dark px-8 py-4 rounded-2xl text-base font-semibold hover:brightness-110 transition-all duration-300 active:scale-95 whitespace-nowrap cursor-pointer">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsletterCta;
