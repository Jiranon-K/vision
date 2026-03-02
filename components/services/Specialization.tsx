const usps = [
  {
    icon: "🔄",
    title: "Real-time Social Sync",
    description:
      "Publish once and Vision instantly pushes your post to Facebook, X, and every connected platform — no third-party scheduler required.",
    highlight: true,
    wide: true,
  },
  {
    icon: "🤖",
    title: "AI-Driven Writing Insights",
    description:
      "Get smart, real-time suggestions on SEO, readability, and tone as you type — so every post performs at its peak before you hit publish.",
    highlight: false,
    wide: false,
  },
  {
    icon: "✍️",
    title: "Creator-First Editor",
    description:
      "Beautiful, distraction-free writing built for humans — not developers. Zero plugins, zero setup, 100% focus.",
    highlight: false,
    wide: false,
  },
  {
    icon: "🔒",
    title: "Your Content, Your Rules",
    description:
      "Full ownership of everything you write. No algorithm suppression, no hidden feed penalties — your voice, amplified.",
    highlight: true,
    wide: false,
  },
  {
    icon: "📊",
    title: "Deep Analytics",
    description:
      "Understand where your readers come from, what keeps them engaged, and how to grow — all in one intuitive dashboard.",
    highlight: false,
    wide: false,
  },
  {
    icon: "⚡",
    title: "Lightning-Fast Publishing",
    description:
      "From draft to live in seconds. Vision's infrastructure means zero downtime, instant indexing, and a fast experience for every reader.",
    highlight: false,
    wide: false,
  },
];

const comparisons = [
  { feature: "One-click social broadcasting", vision: true, others: false },
  { feature: "Built-in SEO optimisation", vision: true, others: false },
  { feature: "AI writing insights", vision: true, others: false },
  { feature: "Full content ownership", vision: true, others: true },
  { feature: "Real-time analytics", vision: true, others: false },
  { feature: "No algorithm suppression", vision: true, others: false },
];

const Tick = ({ yes }: { yes: boolean }) =>
  yes ? (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-brand-lime text-brand-dark font-bold text-sm">
      ✓
    </span>
  ) : (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-brand-dark/10 text-brand-dark/40 font-bold text-sm">
      ✗
    </span>
  );

const Specialization = () => {
  return (
    <section className="max-w-7xl mx-auto py-24 px-4 md:px-10 lg:px-20">
      {/* Section header */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-16">
        <div className="bg-brand-lime px-1.5 rounded-[7px] shrink-0">
          <h2 className="text-3xl md:text-4xl font-medium px-1">Why Vision?</h2>
        </div>
        <p className="text-lg font-normal leading-7 text-brand-dark max-w-[560px]">
          The internet is full of blog tools. Vision is the only one built to{" "}
          <span className="font-semibold">write, sync, and grow</span> — all
          from one place. Here&apos;s what sets us apart.
        </p>
      </div>

      {/* USP Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {usps.map((usp, i) => (
          <div
            key={i}
            className={`
              ${usp.highlight ? "bg-brand-dark text-white" : "bg-brand-gray text-brand-dark"}
              ${usp.wide ? "lg:col-span-3 md:col-span-2" : ""}
              rounded-[36px] border border-brand-dark
              shadow-[0px_5px_0px_0px_rgba(25,26,35,1)]
              hover:shadow-none hover:translate-y-1
              transition-all duration-300
              p-8 flex flex-col gap-4
            `}
          >
            {/* Icon */}
            <span className="text-4xl leading-none">{usp.icon}</span>

            {/* Title */}
            <h3
              className={`text-xl md:text-2xl font-bold leading-snug ${
                usp.highlight ? "text-white" : "text-brand-dark"
              }`}
            >
              {usp.title}
            </h3>

            {/* Divider */}
            <div
              className={`h-px w-full ${
                usp.highlight ? "bg-white/20" : "bg-brand-dark/15"
              }`}
            />

            {/* Description */}
            <p
              className={`text-base leading-relaxed ${
                usp.highlight ? "text-white/75" : "text-brand-dark/75"
              }`}
            >
              {usp.description}
            </p>
          </div>
        ))}
      </div>

      {/* Comparison Table */}
      <div className="bg-brand-gray rounded-[45px] border border-brand-dark shadow-[0px_5px_0px_0px_rgba(25,26,35,1)] p-8 md:p-12">
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
