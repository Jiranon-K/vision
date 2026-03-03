import Image from "next/image";

import { usps, comparisons } from "@/components/data/specialization-data";

const Tick = ({ yes }: { yes: boolean }) =>
  yes ? (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-brand-lime text-brand-dark font-bold text-sm shadow-[0_2px_0_0_#191A23]">
      ✓
    </span>
  ) : (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-brand-dark/10 text-brand-dark/40 font-bold text-sm">
      ✗
    </span>
  );

const Specialization = () => {
  return (
    <section className="max-w-7xl mx-auto py-24 px-4 md:px-10 lg:px-20 overflow-hidden">
      {/* Section header */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-8 mb-20 animate-in fade-in slide-in-from-bottom-5 duration-700">
        <div className="bg-brand-lime px-3 py-1 rounded-[10px] transform -rotate-1 shadow-[4px_4px_0px_0px_#191A23]">
          <h2 className="text-3xl md:text-5xl font-bold px-1 text-brand-dark">
            Why Vision?
          </h2>
        </div>
        <p className="text-xl font-normal leading-relaxed text-brand-dark/80 max-w-[620px]">
          The internet is full of blog tools. Vision is the only one built to{" "}
          <span className="font-bold text-brand-dark border-b-2 border-brand-lime">
            write, sync, and grow
          </span>{" "}
          — all from one place.
        </p>
      </div>

      {/* USP Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
        {usps.map((usp, i) => (
          <div
            key={i}
            className={`
              group
              ${usp.highlight ? "bg-brand-dark text-white" : "bg-brand-gray text-brand-dark"}
              ${usp.wide ? "lg:col-span-3 md:col-span-2" : ""}
              rounded-[42px] border-2 border-brand-dark
              shadow-[0px_8px_0px_0px_rgba(25,26,35,1)]
              hover:shadow-none hover:translate-y-1.5
              transition-all duration-300
              relative overflow-hidden
              ${usp.wide ? "p-4 md:p-12" : "p-10 flex flex-col gap-6"}
            `}
          >
            {usp.wide ? (
              <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
                <div className="flex-1 space-y-6">
                  <h3 className="text-3xl md:text-4xl font-black leading-tight">
                    {usp.title}
                  </h3>
                  <div className="h-1.5 w-24 bg-brand-lime rounded-full" />
                  <p className="text-lg md:text-xl leading-relaxed text-white/80">
                    {usp.description}
                  </p>
                </div>
                <div className="flex-1 relative w-full aspect-square max-w-[450px] animate-pulse-slow">
                  <Image
                    src={usp.icon}
                    alt={usp.title}
                    width={500}
                    height={500}
                    className="w-full h-full object-contain drop-shadow-[20px_20px_50px_rgba(185,255,102,0.15)]"
                    priority
                  />
                </div>
              </div>
            ) : (
              <>
                {/* Icon for regular card */}
                <div className="flex items-center justify-between">
                  {usp.icon.startsWith("/") ? (
                    <div className="w-20 h-20 transform group-hover:rotate-6 transition-transform">
                      <Image
                        src={usp.icon}
                        alt={usp.title}
                        width={80}
                        height={80}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <span className="text-5xl filter drop-shadow-sm group-hover:scale-125 transition-transform inline-block">
                      {usp.icon}
                    </span>
                  )}
                  {usp.highlight && (
                    <span className="bg-brand-lime/20 text-brand-lime text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-brand-lime/30">
                      Best choice
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3
                  className={`text-2xl font-black leading-snug ${
                    usp.highlight ? "text-white" : "text-brand-dark"
                  }`}
                >
                  {usp.title}
                </h3>

                {/* Divider */}
                <div
                  className={`h-0.5 w-12 ${
                    usp.highlight ? "bg-brand-lime" : "bg-brand-dark"
                  }`}
                />

                {/* Description */}
                <p
                  className={`text-base md:text-lg leading-relaxed ${
                    usp.highlight ? "text-white/70" : "text-brand-dark/70"
                  }`}
                >
                  {usp.description}
                </p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Comparison Table */}
      <div className="bg-brand-gray rounded-[45px] border-2 border-brand-dark shadow-[0px_8px_0px_0px_rgba(25,26,35,1)] p-8 md:p-14 mb-12">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_auto_auto] gap-4 pb-4 border-b border-brand-dark/15 mb-2">
          <span className="text-sm font-semibold text-brand-dark/50 uppercase tracking-wider">
            Feature
          </span>
          <span className="flex items-center justify-center gap-1.5 text-sm font-bold text-brand-dark bg-brand-lime px-3 py-1 rounded-full">
            Vision
          </span>
          <span className="flex items-center justify-center text-sm font-semibold text-brand-dark/50">
            Others
          </span>
        </div>

        {/* Rows */}
        <div className="flex flex-col divide-y divide-brand-dark/10">
          {comparisons.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_auto_auto] gap-4 py-4 items-center"
            >
              <span className="text-brand-dark font-medium">{row.feature}</span>
              <div className="flex justify-center">
                <Tick yes={row.vision} />
              </div>
              <div className="flex justify-center">
                <Tick yes={row.others} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Specialization;
