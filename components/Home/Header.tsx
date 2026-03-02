import Image from "next/image";

const Header = () => {
  return (
    <section className="max-w-[1440px] mx-auto px-4 md:px-10 lg:px-20 py-12 md:py-20 lg:py-32 font-sans overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
        {/* Left Side: Content */}
        <div className="flex flex-col gap-10 order-2 lg:order-1 lg:col-span-7">
          <h1 className="text-5xl md:text-7xl lg:text-[84px] font-bold leading-[1.1] text-brand-dark tracking-tight">
            Share Your Vision Reach Every Screen
          </h1>
          <p className="text-xl md:text-2xl lg:text-3xl leading-relaxed text-brand-dark max-w-2xl">
            Experience the power of shared knowledge Write your story, share
            your insights, and instantly broadcast to all your social platforms.
            Vision is where your ideas find their audience
          </p>
          <div>
            <button className="bg-brand-dark text-white px-10 py-5 rounded-2xl text-xl font-medium hover:bg-brand-lime hover:text-brand-dark transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg">
              Join the Community
            </button>
          </div>
        </div>

        {/* Right Side: Image */}
        <div className="order-1 lg:order-2 lg:col-span-5 flex justify-center lg:justify-end">
          <div className="relative w-full aspect-square md:aspect-4/3 lg:aspect-square max-w-[700px] lg:max-w-none lg:w-[120%] lg:-mr-[10%]">
            <Image
              src="/as-01.png"
              alt="Digital Marketing Illustration"
              fill
              priority
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Header;
