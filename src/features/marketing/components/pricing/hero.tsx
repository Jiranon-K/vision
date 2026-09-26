"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { animate, stagger } from "animejs";
import { faqs, freeBeta } from "../../content/pricing-data";

// No Plan is sold during the Free beta (ADR 0008), so the pricing page offers
// one thing and answers what a Creator would ask before trusting it.
const Hero = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const didAnimate = useRef(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !didAnimate.current) {
            didAnimate.current = true;

            animate(".pricing-headline", {
              opacity: [0, 1],
              translateY: [30, 0],
              duration: 700,
              easing: "easeOutCubic",
            });

            animate(".pricing-card", {
              opacity: [0, 1],
              translateY: [40, 0],
              duration: 800,
              delay: 250,
              easing: "easeOutCubic",
            });

            animate(".pricing-faq", {
              opacity: [0, 1],
              translateY: [30, 0],
              delay: stagger(80, { start: 500 }),
              duration: 700,
              easing: "easeOutCubic",
            });

            observer.disconnect();
          }
        });
      },
      { threshold: 0.05 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="max-w-7xl mx-auto px-4 md:px-10 lg:px-20 py-16 md:py-24 font-sans"
    >
      <div className="pricing-headline opacity-0 text-center mb-16 space-y-6">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-brand-dark leading-tight">
          Everything Vision has,{" "}
          <span className="relative inline-block">
            <span className="relative z-10 bg-brand-lime px-4 py-1 rounded-[16px] shadow-[4px_4px_0px_0px_#191A23] -rotate-1 inline-block">
              free
            </span>
          </span>
          <br className="hidden md:block" /> during the beta
        </h1>
        <p className="max-w-2xl mx-auto text-xl md:text-2xl font-medium text-brand-dark/60 leading-relaxed">
          No Plans to choose and no card to enter. Every Creator gets every part
          of Vision we&apos;ve built.
        </p>
      </div>

      <div className="pricing-card opacity-0 mx-auto mb-24 max-w-xl rounded-[32px] border-2 border-brand-dark bg-brand-dark p-8 text-white shadow-[8px_8px_0px_0px_#B9FF66] md:p-10">
        <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-brand-lime">
          {freeBeta.name}
        </h2>
        <p className="mt-2 text-base font-medium text-white/60">
          {freeBeta.description}
        </p>

        <div className="mt-6 mb-8 flex items-end gap-2">
          <span className="text-5xl font-black">฿0</span>
          <span className="mb-2 text-base font-medium text-white/50">
            while Vision is in beta
          </span>
        </div>

        <div className="mb-6 h-[2px] w-full rounded-full bg-white/10" />

        <ul className="space-y-4">
          {freeBeta.features.map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-lime text-brand-dark">
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span className="text-base font-medium text-white/80">{feature}</span>
            </li>
          ))}
        </ul>

        <Link
          href="/dashboard"
          className="mt-8 block w-full rounded-2xl border-2 border-brand-dark bg-brand-lime py-4 text-center text-lg font-black text-brand-dark shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] transition-all duration-300 hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
        >
          {freeBeta.cta}
        </Link>
      </div>

      <div className="mx-auto max-w-3xl">
        <div className="mb-12 text-center">
          <div className="inline-block -rotate-1 rounded-[12px] bg-brand-lime px-4 py-2 shadow-[4px_4px_0px_0px_#191A23]">
            <h2 className="text-3xl font-black uppercase tracking-tight text-brand-dark md:text-4xl">
              Questions
            </h2>
          </div>
        </div>

        <div className="space-y-4">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="pricing-faq group opacity-0 rounded-[24px] border-2 border-brand-dark bg-white shadow-[4px_4px_0px_0px_#191A23] open:bg-brand-gray"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-lg font-bold text-brand-dark [&::-webkit-details-marker]:hidden">
                {faq.question}
                <span
                  aria-hidden
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-dark text-xl leading-none text-brand-lime transition-transform duration-300 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="px-6 pb-6 text-base font-medium leading-relaxed text-brand-dark/70">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
