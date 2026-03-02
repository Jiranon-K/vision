import React from "react";
import Image from "next/image";

const Ctablock = () => {
  return (
    <section className="container mx-auto px-4 py-16 md:py-24">
      <div className="bg-brand-gray rounded-[3rem] p-10 md:p-14 relative flex flex-col md:flex-row items-center justify-between min-h-[350px]">
        <div className="flex-1 space-y-7 z-10 text-center md:text-left">
          <h2 className="text-3xl md:text-4xl font-semibold text-brand-dark leading-tight">
            Ready to share your vision?
          </h2>
          <p className="text-lg text-brand-dark max-w-md mx-auto md:mx-0 font-light leading-relaxed">
            Connect with experts and enthusiasts. Post your insights, engage
            with readers, and grow your digital influence with our powerful
            sharing tools.
          </p>
          <button className="bg-brand-dark text-white px-10 py-5 rounded-2xl text-xl font-medium hover:bg-brand-lime hover:text-brand-dark transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg">
            Join the community
          </button>
        </div>
        <div className="hidden md:flex flex-1 justify-end relative h-full">
          <div className="absolute -right-10 -top-48 lg:right-0 lg:-top-64">
            <Image
              src="/as-02.png"
              alt="CTA Illustration"
              width={500}
              height={500}
              className="object-contain"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Ctablock;
