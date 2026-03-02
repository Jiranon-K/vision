const steps = [
  {
    number: "01",
    title: "Create Your Account",
    description:
      "Sign up in seconds — no credit card needed. Set up your public profile, pick your topics, and you're ready to start writing immediately.",
    tag: "Get Started",
    highlight: true,
  },
  {
    number: "02",
    title: "Write Your Blog",
    description:
      "Use Vision's intuitive rich-text editor to craft compelling posts. Add images, format headings, and preview exactly how readers will see your work.",
    tag: "Create",
    highlight: false,
  },
  {
    number: "03",
    title: "Publish & Sync to Social",
    description:
      "Hit publish and Vision instantly broadcasts your post to Facebook, X (Twitter), and all your connected platforms — reaching your entire audience in one click.",
    tag: "Share",
    highlight: true,
  },
  {
    number: "04",
    title: "Grow Your Audience",
    description:
      "Track real-time analytics, understand what resonates, reply to comments, and watch your readership expand. Vision turns every post into an opportunity.",
    tag: "Grow",
    highlight: false,
  },
];

const Process = () => {
  return (
    <section className="max-w-7xl mx-auto py-24 px-4 md:px-10 lg:px-20">
      {/* Section header */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-16">
        <div className="bg-brand-lime px-1.5 rounded-[7px] shrink-0">
          <h2 className="text-3xl md:text-4xl font-medium px-1">
            How It Works
          </h2>
        </div>
        <p className="text-lg font-normal leading-7 text-brand-dark max-w-[560px]">
          From your first idea to a worldwide audience — four simple steps that
          keep you in flow and put your content in front of the right people.
        </p>
      </div>

      {/* Steps */}
      <div className="relative">
        {/* Vertical connector line (desktop) */}
        <div className="hidden lg:block absolute left-[52px] top-8 bottom-8 w-px bg-brand-dark/10" />

        <div className="flex flex-col gap-6">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`
                ${step.highlight ? "bg-brand-dark text-white" : "bg-brand-gray text-brand-dark"}
                rounded-[45px] border border-brand-dark
                shadow-[0px_5px_0px_0px_rgba(25,26,35,1)]
                hover:shadow-none hover:translate-y-1
                transition-all duration-300
                p-8 md:p-10
                flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-10
              `}
            >
              {/* Step number bubble */}
              <div
                className={`
                  shrink-0 w-16 h-16 rounded-full flex items-center justify-center
                  text-2xl font-bold
                  ${step.highlight ? "bg-brand-lime text-brand-dark" : "bg-brand-dark text-brand-lime"}
                `}
              >
                {step.number}
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <h3
                    className={`text-2xl md:text-[26px] font-bold leading-snug ${
                      step.highlight ? "text-white" : "text-brand-dark"
                    }`}
                  >
                    {step.title}
                  </h3>
                  <span
                    className={`
                      hidden sm:inline-flex text-xs font-semibold px-3 py-1 rounded-full
                      ${step.highlight ? "bg-brand-lime text-brand-dark" : "bg-brand-dark text-white"}
                    `}
                  >
                    {step.tag}
                  </span>
                </div>
                <p
                  className={`text-base leading-relaxed max-w-[680px] ${
                    step.highlight ? "text-white/75" : "text-brand-dark/75"
                  }`}
                >
                  {step.description}
                </p>
              </div>

              {/* Arrow indicator */}
              <div
                className={`hidden md:flex shrink-0 w-11 h-11 rounded-full items-center justify-center
                  ${step.highlight ? "bg-brand-lime" : "bg-brand-dark"}
                `}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 10H16M16 10L11 5M16 10L11 15"
                    stroke={step.highlight ? "#191A23" : "#B9FF66"}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Process;
