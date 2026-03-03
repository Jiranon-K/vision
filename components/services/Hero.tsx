import Link from "next/link";
import Image from "next/image";

import { features } from "@/components/data/hero-data";

const Hero = () => {
  return (
    <>
      <section className="relative w-full py-20 lg:py-32 bg-white overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-20 right-0 w-64 h-64 bg-brand-lime/10 blur-3xl -z-10 rounded-full" />

        <div className="container px-4 md:px-10 lg:px-20 mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 flex flex-col justify-center space-y-10 animate-in fade-in slide-in-from-left-10 duration-1000">
              <div className="space-y-6">
                <h1 className="text-5xl font-black tracking-tight sm:text-6xl md:text-7xl lg:text-8xl text-brand-dark leading-[0.95]">
                  Connect your voice{" "}
                  <div className="inline-block relative">
                    <span className="relative z-10 bg-brand-lime px-4 py-1 rounded-[20px] shadow-[6px_6px_0px_0px_#191A23] -rotate-2 inline-block mt-2">
                      with the world
                    </span>
                  </div>
                </h1>
                <p className="max-w-[620px] text-brand-dark/80 text-xl md:text-2xl font-medium leading-relaxed">
                  Vision is the ultimate infrastructure for modern creators.
                  Write, sync, and scale your influence across the entire social
                  ecosystem.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-6">
                <Link
                  href="#write"
                  className="group relative inline-flex items-center justify-center rounded-2xl bg-brand-dark px-10 py-5 text-lg font-black text-white shadow-[8px_8px_0px_0px_#B9FF66] transition-all hover:shadow-none hover:translate-x-1 hover:translate-y-1 duration-300"
                >
                  Start Writing Now
                  <svg
                    className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Right Illustration */}
            <div className="lg:col-span-5 relative flex justify-center items-center h-full min-h-[500px] animate-in fade-in zoom-in-95 duration-1000 delay-300">
              <div className="relative w-full aspect-[4/5] max-w-[550px]">
                {/* Main Illustration */}
                <div className="absolute inset-0 bg-brand-lime/5 rounded-[60px] -rotate-3 -z-10 border-2 border-brand-dark/5" />
                <div className="absolute inset-0 bg-brand-gray/50 rounded-[60px] rotate-2 -z-10 border-2 border-brand-dark shadow-[20px_20px_0px_0px_#B9FF66]" />

                <div className="relative w-full h-full p-8 flex items-center justify-center overflow-hidden group">
                  <Image
                    src="/as-04.png"
                    alt="Vision Platform Visualization"
                    width={600}
                    height={600}
                    className="w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(25,26,35,0.2)] group-hover:scale-110 transition-transform duration-700"
                    priority
                  />

                  <div className="absolute bottom-20 left-0 w-32 h-32 bg-brand-lime p-4 rounded-full border-2 border-brand-dark shadow-lg">
                    <Image
                      src="/as-01.png"
                      alt="Icon"
                      width={100}
                      height={100}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto py-32 px-4 md:px-10 lg:px-20 bg-white">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-10 mb-24">
          <div className="bg-brand-lime px-4 py-2 rounded-[12px] transform -rotate-1 shadow-[4px_4px_0px_0px_#191A23] shrink-0">
            <h2 className="text-4xl md:text-5xl font-black px-1 text-brand-dark uppercase tracking-tight">
              Features
            </h2>
          </div>
          <p className="text-xl md:text-2xl font-medium leading-relaxed text-brand-dark/70 max-w-[650px]">
            Everything you need to write, grow, and share — built for creators
            who refuse to be invisible in a crowded digital space.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`
                ${feature.bgColor} 
                p-12 md:p-14 
                rounded-[56px] 
                border-2 border-brand-dark 
                shadow-[0px_10px_0px_0px_rgba(25,26,35,1)] 
                flex flex-col gap-8 
                group 
                cursor-pointer 
                transition-all duration-400 
                hover:shadow-none 
                hover:translate-y-2
                relative overflow-hidden
              `}
            >
              {/* Background Decoration */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />

              {/* Top row: icon + badge */}
              <div className="flex items-center justify-between">
                <div className="w-24 h-24 transform group-hover:rotate-6 group-hover:scale-110 transition-all duration-500">
                  <Image
                    src={feature.icon}
                    alt={feature.title}
                    width={120}
                    height={120}
                    className="w-full h-full object-contain drop-shadow-md"
                  />
                </div>
                <span
                  className={`
                    ${feature.badgeBg} 
                    text-brand-dark text-sm font-black px-5 py-2 rounded-full border-2 border-brand-dark shadow-[4px_4px_0px_0px_#191A23] uppercase tracking-widest
                  `}
                >
                  {feature.badge}
                </span>
              </div>

              {/* Content Space */}
              <div className="space-y-4">
                <h3
                  className={`${feature.textColor} text-3xl md:text-4xl font-black leading-none uppercase tracking-tight`}
                >
                  {feature.title}
                </h3>
                <div
                  className={`h-1.5 w-16 rounded-full ${feature.bgColor === "bg-brand-dark" ? "bg-brand-lime" : "bg-brand-dark"}`}
                />
                <p
                  className={`${feature.bgColor === "bg-brand-dark" ? "text-white/70" : "text-brand-dark/70"} text-lg md:text-xl font-medium leading-relaxed`}
                >
                  {feature.description}
                </p>
              </div>

              {/* Learn more link */}
              <div className="flex items-center gap-3 mt-auto pt-6 border-t border-brand-dark/10 group-hover:gap-5 transition-all">
                <span
                  className={`text-lg font-black uppercase tracking-tighter ${feature.bgColor === "bg-brand-dark" ? "text-brand-lime" : "text-brand-dark"}`}
                >
                  Explore module
                </span>
                <div
                  className={`p-2 rounded-full border-2 border-brand-dark ${feature.bgColor === "bg-brand-dark" ? "bg-brand-lime text-brand-dark" : "bg-brand-dark text-brand-lime"}`}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5 12H19M19 12L13 6M19 12L13 18"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default Hero;
