"use client";

import Link from "next/link";
import { toast } from "sonner";

// href: null = page doesn't exist yet — renders a button that toasts instead of a dead link.
const productLinks: { name: string; href: string | null }[] = [
  { name: "Services", href: "/services" },
  { name: "Pricing", href: "/pricing" },
  { name: "Blog", href: "/blog" },
];

const linkClass =
  "text-white/60 hover:text-white transition-colors duration-200";

const FooterProductLinks = () => {
  const notReady = (name: string) =>
    toast.info(`${name} isn't available yet`, {
      description: "This page is coming soon.",
    });

  return (
    <ul className="flex flex-col gap-3">
      {productLinks.map((l) => (
        <li key={l.name}>
          {l.href ? (
            <Link href={l.href} className={linkClass}>
              {l.name}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => notReady(l.name)}
              className={`${linkClass} cursor-pointer`}
            >
              {l.name}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
};

export default FooterProductLinks;
