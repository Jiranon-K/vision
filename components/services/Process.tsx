import Image from "next/image";

const steps = [
  {
    number: "01",
    icon: "/services/s-2.png",
    title: "Create Your Account",
    description:
      "Sign up in seconds — no credit card needed. Set up your public profile, pick your topics, and you're ready to start writing immediately.",
    tag: "Get Started",
    highlight: true,
  },
  {
    number: "02",
    icon: "/as-03.png",
    title: "Write Your Blog",
    description:
      "Use Vision's intuitive rich-text editor to craft compelling posts. Add images, format headings, and preview exactly how readers will see your work.",
    tag: "Create",
    highlight: false,
  },
  {
    number: "03",
    icon: "/as-06.png",
    title: "Publish & Sync to Social",
    description:
      "Hit publish and Vision instantly broadcasts your post to Facebook, X (Twitter), and all your connected platforms — reaching your entire audience in one click.",
    tag: "Share",
    highlight: true,
  },
  {
    number: "04",
    icon: "/services/s-3.png",
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
      <div className="flex flex-col md:flex-row items-start md:items-center gap-8 mb-20">
        <div className="bg-brand-lime px-3 py-1 rounded-[10px] transform -rotate-1 shadow-[4px_4px_0px_0px_#191A23]">
          <h2 className="text-3xl md:text-5xl font-bold px-1 text-brand-dark">
            How It Works
          </h2>
        </div>
        <p className="text-xl font-normal leading-relaxed text-brand-dark/80 max-w-[600px]">
          From your first idea to a worldwide audience — four simple steps that
          keep you in flow and put your content in front of the right people.
        </p>
      </div>

      {/* Steps */}
      <div className="relative">
        {/* Vertical connector line (desktop) */}
        <div className="hidden lg:block absolute left-[52px] top-8 bottom-8 w-px bg-brand-dark/10" />

        <div className="flex flex-col gap-10">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`
                group
                relative
                ${step.highlight ? "bg-brand-dark text-white" : "bg-brand-gray text-brand-dark"}
                rounded-[48px] border-2 border-brand-dark
                shadow-[0px_8px_0px_0px_rgba(25,26,35,1)]
                hover:shadow-none hover:translate-y-1.5
                transition-all duration-300
                p-8 md:p-12
                flex flex-col md:flex-row items-center gap-8 md:gap-14
              `}
            >
              {/* Step number and Illustration */}
              <div className="relative shrink-0 w-32 h-32 md:w-44 md:h-44 flex items-center justify-center">
                {/* Step number bubble - Floating */}
                <div
                  className={`
                    absolute top-0 -left-2 z-10 w-12 h-12 rounded-full flex items-center justify-center
                    text-xl font-black
                    ${step.highlight ? "bg-brand-lime text-brand-dark" : "bg-brand-dark text-brand-lime"}
                    border-2 border-brand-dark shadow-[2px_2px_0px_0px_#191A23]
                  `}
                >
                  {step.number}
                </div>

                {/* Illustration */}
                <div className="w-full h-full p-4 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                  <Image
                    src={step.icon}
                    alt={step.title}
                    width={200}
                    height={200}
                    className="w-full h-full object-contain filter drop-shadow-lg"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  <h3
                    className={`text-2xl md:text-4xl font-black leading-tight ${
                      step.highlight ? "text-white" : "text-brand-dark"
                    }`}
                  >
                    {step.title}
                  </h3>
                  <span
                    className={`
                      text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest
                      ${step.highlight ? "bg-brand-lime/20 text-brand-lime border border-brand-lime/30" : "bg-brand-dark/10 text-brand-dark/60"}
                    `}
                  >
                    {step.tag}
                  </span>
                </div>

                <div
                  className={`h-1.5 w-16 rounded-full ${step.highlight ? "bg-brand-lime" : "bg-brand-dark"}`}
                />

                <p
                  className={`text-lg md:text-xl leading-relaxed max-w-[700px] ${
                    step.highlight ? "text-white/70" : "text-brand-dark/70"
                  }`}
                >
                  {step.description}
                </p>
              </div>

              {/* Arrow indicator */}
              <div
                className={`hidden md:flex shrink-0 w-16 h-16 rounded-2xl items-center justify-center border-2 border-brand-dark rotate-45 transform group-hover:rotate-0 transition-all duration-300
                  ${step.highlight ? "bg-brand-lime" : "bg-brand-dark"}
                `}
              >
                <div className="-rotate-45 group-hover:rotate-0 transition-transform duration-300">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5 12H19M19 12L13 6M19 12L13 18"
                      stroke={step.highlight ? "#191A23" : "#B9FF66"}
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
      </div>
    </section>
  );
};

export default Process;
