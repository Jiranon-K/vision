"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { name: "Services", href: "/services" },
    { name: "Pricing", href: "/pricing" },
    { name: "Blog", href: "/blog" },
  ];

  const toggleMenu = () => setIsOpen(!isOpen);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <nav className="relative py-8 px-4 md:px-10 lg:px-20 max-w-7xl mx-auto font-sans">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group z-50">
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="transform group-hover:rotate-12 transition-transform duration-300"
          >
            <path
              d="M16 0L19.2426 12.7574L32 16L19.2426 19.2426L16 32L12.7574 19.2426L0 16L12.7574 12.7574L16 0Z"
              fill="currentColor"
            />
          </svg>
          <span className="text-3xl font-bold tracking-tight text-brand-dark">
            Vision
          </span>
        </Link>

        {/* Desktop Navigation Links & CTA */}
        <div className="hidden lg:flex items-center gap-10">
          <ul className="flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className={`text-lg font-normal px-6 py-2 rounded-full transition-all duration-300 ease-in-out ${
                      isActive
                        ? "bg-brand-dark text-brand-lime shadow-md"
                        : "text-brand-dark hover:bg-brand-dark/5"
                    }`}
                  >
                    {link.name}
                  </Link>
                </li>
              );
            })}
          </ul>
          <button className="border-2 border-brand-dark px-8 py-4 rounded-xl text-lg font-medium hover:bg-brand-dark hover:text-white transition-all duration-300 active:scale-95 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] hover:shadow-none">
            Get Started
          </button>
        </div>

        {/* Mobile Menu Icon */}
        <div className="lg:hidden z-50">
          <button
            onClick={toggleMenu}
            className="p-2 text-brand-dark focus:outline-none"
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="18" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 bg-white z-40 lg:hidden transition-transform duration-300 ease-in-out overflow-hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col items-center justify-center h-full gap-8 px-6">
          <ul className="flex flex-col items-center gap-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`text-2xl font-medium px-8 py-3 rounded-full transition-all duration-300 ease-in-out block text-center ${
                      isActive
                        ? "bg-brand-dark text-brand-lime"
                        : "text-brand-dark"
                    }`}
                  >
                    {link.name}
                  </Link>
                </li>
              );
            })}
          </ul>
          <button
            onClick={() => setIsOpen(false)}
            className="w-full max-w-[280px] border-2 border-brand-dark px-8 py-4 rounded-xl text-xl font-medium hover:bg-brand-dark hover:text-white transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)]"
          >
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
