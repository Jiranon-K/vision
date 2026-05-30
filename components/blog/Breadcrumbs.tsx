import Link from "next/link";
import { SITE_URL } from "@/lib/site";

type Crumb = { name: string; href: string };

// Visible breadcrumb trail + matching BreadcrumbList JSON-LD for search engines.
export default function Breadcrumbs({ title }: { title: string }) {
  const crumbs: Crumb[] = [
    { name: "Home", href: "/" },
    { name: "Blog", href: "/blog" },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      ...crumbs.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: c.name,
        item: `${SITE_URL}${c.href}`,
      })),
      {
        "@type": "ListItem",
        position: crumbs.length + 1,
        name: title,
      },
    ],
  };

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <ol className="flex flex-wrap items-center gap-2 text-sm text-brand-dark/50">
        {crumbs.map((c) => (
          <li key={c.href} className="flex items-center gap-2">
            <Link
              href={c.href}
              className="hover:text-brand-dark transition-colors"
            >
              {c.name}
            </Link>
            <span aria-hidden="true">/</span>
          </li>
        ))}
        <li className="text-brand-dark/80 font-medium line-clamp-1 max-w-[60vw]">
          {title}
        </li>
      </ol>
    </nav>
  );
}
