import Link from "next/link";
import SocialLinks from "@/components/SocialLinks";
import FooterProductLinks from "@/components/FooterProductLinks";

const Footer = () => (
  <footer className="bg-brand-dark text-white rounded-t-[45px] mt-20">
    <div className="max-w-7xl mx-auto px-4 md:px-10 lg:px-20 py-16 md:py-20">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12">
        {/* Brand */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <Link href="/" className="flex items-center gap-2 group w-fit">
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-brand-lime transition-transform duration-300 group-hover:rotate-12"
            >
              <path
                d="M16 0L19.2426 12.7574L32 16L19.2426 19.2426L16 32L12.7574 19.2426L0 16L12.7574 12.7574L16 0Z"
                fill="currentColor"
              />
            </svg>
            <span className="text-3xl font-bold tracking-tight">Vision</span>
          </Link>
          <p className="text-white/60 text-base leading-relaxed max-w-sm">
            Write your story, broadcast it everywhere, and grow your audience —
            the infrastructure for modern creators.
          </p>
          <SocialLinks />
        </div>

        {/* Product links */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <h3 className="text-brand-lime text-sm font-semibold uppercase tracking-widest">
            Product
          </h3>
          <FooterProductLinks />
        </div>
      </div>

      {/* Bottom bar */}
      <div className="mt-14 pt-8 border-t border-white/10">
        <p className="text-white/40 text-sm">
          © 2026 Vision. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
