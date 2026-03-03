"use client";

import { useState, useEffect, useRef } from "react";
import { animate, stagger } from "animejs";
import { plans, pricingFeatures } from "@/components/data/pricing-data";

const Hero = () => {
  const [isYearly, setIsYearly] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
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

            animate(".pricing-toggle", {
              opacity: [0, 1],
              translateY: [20, 0],
              duration: 600,
              delay: 200,
              easing: "easeOutCubic",
            });

            animate(".pricing-card", {
              opacity: [0, 1],
              translateY: [40, 0],
              delay: stagger(120, { start: 400 }),
              duration: 800,
              easing: "easeOutCubic",
            });

            animate(".pricing-table", {
              opacity: [0, 1],
              translateY: [30, 0],
              duration: 800,
              delay: 900,
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

  const formatPrice = (price: number) => {
    if (price === 0) return "ฟรี";
    return `฿${price.toLocaleString()}`;
  };

  const renderFeatureValue = (value: boolean | string) => {
    if (value === true) {
      return (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-lime/20">
          <svg
            className="w-5 h-5 text-brand-dark"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </span>
      );
    }
    if (value === false) {
      return (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-dark/5">
          <svg
            className="w-4 h-4 text-brand-dark/25"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </span>
      );
    }
    return (
      <span className="inline-block px-3 py-1 rounded-full text-sm font-bold bg-brand-lime/15 text-brand-dark border border-brand-lime/30">
        {value}
      </span>
    );
  };

  return (
    <section
      ref={sectionRef}
      className="max-w-7xl mx-auto px-4 md:px-10 lg:px-20 py-16 md:py-24 font-sans"
    >
      {/* ── Headline ── */}
      <div className="pricing-headline opacity-0 text-center mb-16 space-y-6">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-brand-dark leading-tight">
          Choose the plan that{" "}
          <span className="relative inline-block">
            <span className="relative z-10 bg-brand-lime px-4 py-1 rounded-[16px] shadow-[4px_4px_0px_0px_#191A23] -rotate-1 inline-block">
              fits you best
            </span>
          </span>
          <br className="hidden md:block" />
          and unlock your creative potential
        </h1>
        <p className="max-w-2xl mx-auto text-xl md:text-2xl font-medium text-brand-dark/60 leading-relaxed">
          Flexible plans designed for creators at every level — from beginners
          to professional organizations.
        </p>
      </div>

      {/* ── Billing Toggle ── */}
      <div className="pricing-toggle opacity-0 flex items-center justify-center gap-4 mb-16">
        <span
          className={`text-lg font-bold transition-colors duration-300 ${!isYearly ? "text-brand-dark" : "text-brand-dark/40"}`}
        >
          Monthly
        </span>

        <button
          id="billing-toggle"
          onClick={() => setIsYearly(!isYearly)}
          className={`relative w-[72px] h-[38px] rounded-full border-2 border-brand-dark transition-colors duration-300 cursor-pointer ${
            isYearly ? "bg-brand-lime" : "bg-brand-gray"
          }`}
          aria-label="Toggle billing period"
        >
          <span
            className={`absolute top-[3px] left-[3px] w-[28px] h-[28px] rounded-full bg-brand-dark transition-transform duration-300 ${
              isYearly ? "translate-x-[34px]" : "translate-x-0"
            }`}
          />
        </button>

        <span
          className={`text-lg font-bold transition-colors duration-300 ${isYearly ? "text-brand-dark" : "text-brand-dark/40"}`}
        >
          Yearly
        </span>

        <span className="ml-2 bg-brand-lime text-brand-dark text-sm font-black px-4 py-1.5 rounded-full border-2 border-brand-dark shadow-[3px_3px_0px_0px_#191A23] -rotate-2">
          Save 20%
        </span>
      </div>

      {/* ── Pricing Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
        {plans.map((plan, index) => {
          const price = isYearly ? plan.price.yearly : plan.price.monthly;
          const isHighlight = plan.highlight;
          const isBusiness = plan.name === "Business";

          return (
            <div
              key={plan.name}
              className={`pricing-card opacity-0 relative rounded-[32px] border-2 border-brand-dark p-8 md:p-10 flex flex-col transition-all duration-500 group hover:-translate-y-2 ${
                isHighlight
                  ? "bg-white shadow-[8px_8px_0px_0px_#B9FF66] md:scale-105 md:-my-4 z-10"
                  : isBusiness
                    ? "bg-brand-dark text-white shadow-[8px_8px_0px_0px_#B9FF66]"
                    : "bg-brand-gray shadow-[8px_8px_0px_0px_#191A23]"
              }`}
              style={{ animationDelay: `${index * 120}ms` }}
            >
              {/* Gradient glow for Pro card */}
              {isHighlight && (
                <div className="absolute -inset-[2px] rounded-[34px] bg-linear-to-br from-brand-lime via-brand-lime/60 to-brand-dark/30 -z-10" />
              )}

              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-brand-lime text-brand-dark text-sm font-black px-6 py-2 rounded-full border-2 border-brand-dark shadow-[3px_3px_0px_0px_#191A23] whitespace-nowrap">
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Plan Name */}
              <h3
                className={`text-2xl font-black uppercase tracking-tight mt-4 ${isBusiness ? "text-brand-lime" : "text-brand-dark"}`}
              >
                {plan.name}
              </h3>

              {/* Description */}
              <p
                className={`text-base font-medium mt-2 ${isBusiness ? "text-white/60" : "text-brand-dark/50"}`}
              >
                {plan.description}
              </p>

              {/* Price */}
              <div className="mt-6 mb-8">
                <div className="flex items-end gap-2">
                  <span
                    className={`text-5xl font-black ${isBusiness ? "text-white" : "text-brand-dark"}`}
                  >
                    {formatPrice(price)}
                  </span>
                  {price > 0 && (
                    <span
                      className={`text-base font-medium mb-2 ${isBusiness ? "text-white/50" : "text-brand-dark/40"}`}
                    >
                      /mo
                    </span>
                  )}
                </div>
                {isYearly && price > 0 && (
                  <p
                    className={`text-sm font-medium mt-1 ${isBusiness ? "text-brand-lime/70" : "text-brand-dark/40"}`}
                  >
                    Billed ฿{(price * 12).toLocaleString()} per year
                  </p>
                )}
              </div>

              {/* Divider */}
              <div
                className={`h-[2px] w-full rounded-full mb-6 ${isBusiness ? "bg-white/10" : "bg-brand-dark/10"}`}
              />

              {/* Features */}
              <ul className="space-y-4 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                        isBusiness
                          ? "bg-brand-lime text-brand-dark"
                          : isHighlight
                            ? "bg-brand-lime text-brand-dark"
                            : "bg-brand-dark text-brand-lime"
                      }`}
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </span>
                    <span
                      className={`text-base font-medium ${isBusiness ? "text-white/80" : "text-brand-dark/70"}`}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                className={`mt-8 w-full py-4 rounded-2xl text-lg font-black border-2 border-brand-dark transition-all duration-300 cursor-pointer ${
                  isHighlight
                    ? "bg-brand-dark text-white shadow-[4px_4px_0px_0px_#B9FF66] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
                    : isBusiness
                      ? "bg-brand-lime text-brand-dark shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
                      : "bg-white text-brand-dark shadow-[4px_4px_0px_0px_#191A23] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
                }`}
              >
                {plan.cta}
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Comparison Table ── */}
      <div className="pricing-table opacity-0">
        <div className="text-center mb-12">
          <div className="inline-block bg-brand-lime px-4 py-2 rounded-[12px] -rotate-1 shadow-[4px_4px_0px_0px_#191A23]">
            <h2 className="text-3xl md:text-4xl font-black text-brand-dark uppercase tracking-tight">
              Compare Plans
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto rounded-[24px] border-2 border-brand-dark shadow-[6px_6px_0px_0px_#191A23]">
          <table className="w-full min-w-[640px]">
            {/* Header */}
            <thead>
              <tr className="bg-brand-dark text-white">
                <th className="text-left px-6 py-5 text-lg font-black uppercase tracking-tight w-[35%]">
                  Feature
                </th>
                {plans.map((plan) => (
                  <th
                    key={plan.name}
                    className={`text-center px-4 py-5 text-lg font-black uppercase tracking-tight ${
                      plan.highlight ? "bg-brand-lime text-brand-dark" : ""
                    }`}
                  >
                    {plan.name}
                    {plan.highlight && (
                      <span className="block text-xs font-bold mt-0.5 opacity-70">
                        ★ Recommended
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {pricingFeatures.map((feature, idx) => (
                <tr
                  key={feature.id}
                  className={`border-t border-brand-dark/10 transition-colors duration-200 hover:bg-brand-lime/5 ${
                    idx % 2 === 0 ? "bg-white" : "bg-brand-gray/50"
                  }`}
                >
                  {/* Feature Name + Tooltip */}
                  <td className="px-6 py-5 relative">
                    <div
                      className="inline-flex items-center gap-2 cursor-help"
                      onMouseEnter={() => setActiveTooltip(feature.id)}
                      onMouseLeave={() => setActiveTooltip(null)}
                    >
                      <span className="text-base font-bold text-brand-dark">
                        {feature.name}
                      </span>
                      <span className="w-5 h-5 rounded-full bg-brand-dark/10 text-brand-dark/50 flex items-center justify-center text-xs font-black shrink-0">
                        ?
                      </span>

                      {/* Tooltip */}
                      {activeTooltip === feature.id && (
                        <div className="absolute left-6 bottom-full mb-2 z-50 w-72 p-4 bg-brand-dark text-white text-sm font-medium leading-relaxed rounded-2xl border-2 border-brand-lime shadow-[4px_4px_0px_0px_#B9FF66] animate-in fade-in zoom-in-95 duration-200">
                          {feature.tooltip}
                          <div className="absolute -bottom-2 left-8 w-4 h-4 bg-brand-dark border-r-2 border-b-2 border-brand-lime transform rotate-45" />
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Values */}
                  <td className="text-center px-4 py-5">
                    {renderFeatureValue(feature.starter)}
                  </td>
                  <td
                    className={`text-center px-4 py-5 ${
                      plans[1].highlight ? "bg-brand-lime/5" : ""
                    }`}
                  >
                    {renderFeatureValue(feature.pro)}
                  </td>
                  <td className="text-center px-4 py-5">
                    {renderFeatureValue(feature.business)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default Hero;
