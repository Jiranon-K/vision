"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { animate, stagger } from "animejs";

const ArrowIcon = ({
  circleFill,
  arrowFill,
}: {
  circleFill: string;
  arrowFill: string;
}) => (
  <svg
    width="41"
    height="41"
    viewBox="0 0 41 41"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="transition-all duration-300 group-hover:rotate-45 group-hover:scale-110"
  >
    <circle cx="20.5" cy="20.5" r="20.5" fill={circleFill} />
    <path
      d="M11.25 24.701C10.5326 25.1152 10.2867 26.0326 10.701 26.75C11.1152 27.4674 12.0326 27.7133 12.75 27.299L11.25 24.701ZM30.7694 16.3882C30.9838 15.588 30.5089 14.7655 29.7087 14.5511L16.6687 11.0571C15.8685 10.8426 15.046 11.3175 14.8316 12.1177C14.6172 12.9179 15.0921 13.7404 15.8923 13.9548L27.4834 17.0607L24.3776 28.6518C24.1631 29.452 24.638 30.2745 25.4382 30.4889C26.2384 30.7033 27.0609 30.2284 27.2753 29.4282L30.7694 16.3882ZM12.75 27.299L30.0705 17.299L28.5705 14.701L11.25 24.701L12.75 27.299Z"
      fill={arrowFill}
    />
  </svg>
);
import { servicesData } from "@/components/data/services-data";

const Services = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const didAnimate = useRef(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !didAnimate.current) {
            didAnimate.current = true;

            // Section header badge + description
            if (headerRef.current) {
              animate(headerRef.current.children, {
                opacity: [0, 1],
                translateY: [20, 0],
                delay: stagger(120),
                duration: 600,
                easing: "easeOutCubic",
              });
            }

            if (gridRef.current) {
              animate(Array.from(gridRef.current.children), {
                opacity: [0, 1],
                translateY: [40, 0],
                delay: stagger(90),
                duration: 650,
                easing: "easeOutExpo",
              });
            }

            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="max-w-7xl mx-auto py-24 px-4 md:px-10 lg:px-20 overflow-hidden"
    >
      {/* Header section */}
      <div
        ref={headerRef}
        className="flex flex-col md:flex-row items-center gap-10"
      >
        <div className="bg-brand-lime px-1.5 rounded-[7px] opacity-0">
          <h2 className="text-4xl font-medium px-1">Features</h2>
        </div>
        <div className="max-w-[580px] opacity-0">
          <p className="text-lg font-normal leading-6">
            Empowering your digital presence with tools designed for creators
            and businesses alike. Here&apos;s what you can do on Vision:
          </p>
        </div>
      </div>

      {/* Cards grid */}
      <div
        ref={gridRef}
        className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-20"
      >
        {servicesData.map((service, index) => (
          <div
            key={index}
            className={`${service.bgColor} p-12 rounded-[45px] border border-brand-dark shadow-[0px_5px_0px_0px_rgba(25,26,35,1)] flex justify-between h-[310px] group cursor-pointer transition-all duration-300 hover:shadow-none translate-y-0 hover:translate-y-1 opacity-0`}
          >
            {/* Left side content */}
            <div className="flex flex-col justify-between h-full">
              <div className="flex flex-col gap-1">
                {service.title.map((line, lw) => (
                  <span
                    key={lw}
                    className={`${service.headingBg} text-brand-dark text-[26px] md:text-[30px] font-medium leading-[38px] px-1.5 rounded-[7px] w-fit`}
                  >
                    {line}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <ArrowIcon
                  circleFill={
                    service.bgColor === "bg-brand-dark" ? "white" : "#191A23"
                  }
                  arrowFill={
                    service.bgColor === "bg-brand-dark" ? "black" : "#B9FF66"
                  }
                />
                <span
                  className={`${service.textColor} text-xl font-normal hidden lg:block`}
                >
                  Try it now
                </span>
              </div>
            </div>

            {/* Right side illustration */}
            <div className="relative flex items-center justify-center w-[210px] h-full overflow-hidden">
              <Image
                src={service.image}
                alt={service.title.join(" ")}
                fill
                className="object-contain"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Services;
