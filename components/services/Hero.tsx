import Link from "next/link";
import Image from "next/image";

const features = [
  {
    icon: "✍️",
    badge: "Create",
    title: "Rich Blog Editor",
    description:
      "Write beautifully formatted posts with our intuitive editor. Add media, style your content, and publish in minutes — no code required.",
    bgColor: "bg-brand-gray",
    badgeBg: "bg-brand-lime",
    textColor: "text-brand-dark",
  },
  {
    icon: "📣",
    badge: "Share",
    title: "One-Click Social Sync",
    description:
      "Broadcast your posts to Facebook, X (Twitter), and more with a single click. Reach your entire audience the moment you hit publish.",
    bgColor: "bg-brand-lime",
    badgeBg: "bg-white",
    textColor: "text-brand-dark",
  },
  {
    icon: "🔍",
    badge: "Discover",
    title: "Search Visibility",
    description:
      "Get discovered by the right readers. Vision optimises every post for search engines so your content ranks and your audience grows organically.",
    bgColor: "bg-brand-dark",
    badgeBg: "bg-brand-lime",
    textColor: "text-white",
  },
  {
    icon: "🚀",
    badge: "Grow",
    title: "Audience Connect",
    description:
      "Build a loyal following with comments, reactions, and subscriber lists. Engage readers directly and turn casual visitors into fans.",
    bgColor: "bg-brand-gray",
    badgeBg: "bg-brand-lime",
    textColor: "text-brand-dark",
  },
  {
    icon: "📊",
    badge: "Analyse",
    title: "Growth Analytics",
    description:
      "Track views, shares, and engagement in real time. Understand what resonates and double down on the content that drives results.",
    bgColor: "bg-brand-lime",
    badgeBg: "bg-white",
    textColor: "text-brand-dark",
  },
  {
    icon: "🛡️",
    badge: "Control",
    title: "Smart Creator Hub",
    description:
      "Manage all your posts, drafts, and social connections from one powerful dashboard. Your creative workflow, streamlined.",
    bgColor: "bg-brand-dark",
    badgeBg: "bg-brand-lime",
    textColor: "text-white",
  },
];

const Hero = () => {
  return (
    <>
      <section className="relative w-full py-12 md:py-24 lg:py-32 bg-white overflow-hidden">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="flex flex-col justify-center space-y-6">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-brand-dark leading-tight">
                  Connect your voice{" "}
                  <span className="bg-brand-lime px-2 rounded-lg">
                    with the world
                  </span>
                </h1>
                <p className="max-w-[600px] text-brand-dark md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed font-medium">
                  Vision is the ultimate platform for creators. Write your
                  blogs, share your vision, and instantly sync with Facebook, X,
                  and more to reach your audience everywhere.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="#write"
                  className="inline-flex items-center justify-center rounded-xl bg-brand-dark px-8 py-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-lime hover:text-brand-dark duration-300 transform hover:scale-105 sm:w-auto"
                >
                  Start Writing Now
                </Link>
              </div>
            </div>
            <div className="relative flex justify-center items-center">
              <div className="relative w-full max-w-[500px] aspect-square">
                <Image
                  src="/as-03.png"
                  alt="Digital Marketing Illustration"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto py-24 px-4 md:px-10 lg:px-20">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-16">
          <div className="bg-brand-lime px-1.5 rounded-[7px] shrink-0">
            <h2 className="text-3xl md:text-4xl font-medium px-1">Features</h2>
          </div>
          <p className="text-lg font-normal leading-7 text-brand-dark max-w-[560px]">
            Everything you need to write, grow, and share — built for creators
            who refuse to be invisible.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`${feature.bgColor} p-10 rounded-[45px] border border-brand-dark shadow-[0px_5px_0px_0px_rgba(25,26,35,1)] flex flex-col gap-5 group cursor-pointer transition-all duration-300 hover:shadow-none hover:translate-y-1`}
            >
              {/* Top row: icon + badge */}
              <div className="flex items-center gap-3">
                <span className="text-3xl leading-none">{feature.icon}</span>
                <span
                  className={`${feature.badgeBg} text-brand-dark text-sm font-semibold px-3 py-1 rounded-full`}
                >
                  {feature.badge}
                </span>
              </div>

              {/* Title */}
              <h3
                className={`${feature.textColor} text-2xl md:text-[28px] font-bold leading-snug`}
              >
                {feature.title}
              </h3>

              {/* Divider */}
              <div
                className={`h-px w-full ${
                  feature.bgColor === "bg-brand-dark"
                    ? "bg-white/20"
                    : "bg-brand-dark/20"
                }`}
              />

              {/* Description */}
              <p
                className={`${
                  feature.bgColor === "bg-brand-dark"
                    ? "text-white/80"
                    : "text-brand-dark/80"
                } text-base leading-relaxed`}
              >
                {feature.description}
              </p>

              {/* Learn more link */}
              <div className="flex items-center gap-2 mt-auto pt-2">
                <span
                  className={`text-sm font-semibold transition-all ${
                    feature.bgColor === "bg-brand-dark"
                      ? "text-brand-lime"
                      : "text-brand-dark"
                  }`}
                >
                  Learn more →
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default Hero;
