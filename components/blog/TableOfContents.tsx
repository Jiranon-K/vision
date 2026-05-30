"use client";

import { useEffect, useState } from "react";

type Heading = { id: string; text: string; level: number };

export default function TableOfContents({
  className = "",
  collapsible = false,
}: {
  className?: string;
  collapsible?: boolean;
}) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    // rehype-slug only adds ids to the rendered article's markdown headings,
    // so this selector matches exactly those — reading the live DOM guarantees
    // the anchors line up with the real heading ids (no slug re-derivation).
    const els = Array.from(
      document.querySelectorAll<HTMLElement>("h2[id], h3[id]"),
    );
    // One-shot read of the rendered article headings on mount (an external DOM
    // source), so a single setState in the effect is intentional here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHeadings(
      els.map((el) => ({
        id: el.id,
        text: el.textContent?.trim() ?? "",
        level: el.tagName === "H3" ? 3 : 2,
      })),
    );

    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        const topmost = visible.reduce((a, b) =>
          a.boundingClientRect.top < b.boundingClientRect.top ? a : b,
        );
        setActiveId(topmost.target.id);
      },
      { rootMargin: "0px 0px -80% 0px", threshold: 0 },
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  if (headings.length === 0) return null;

  const handleClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: string,
  ) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(id);
    history.replaceState(null, "", `#${id}`);
  };

  const list = (
    <ul className="space-y-2 text-sm">
      {headings.map((h) => (
        <li key={h.id} style={{ paddingLeft: (h.level - 2) * 12 }}>
          <a
            href={`#${h.id}`}
            onClick={(e) => handleClick(e, h.id)}
            className={`block leading-snug transition-colors hover:text-brand-dark ${
              activeId === h.id
                ? "text-brand-dark font-semibold"
                : "text-brand-dark/50"
            }`}
          >
            {h.text}
          </a>
        </li>
      ))}
    </ul>
  );

  const label = (
    <span className="text-xs font-bold uppercase tracking-wider text-brand-dark/40">
      On this page
    </span>
  );

  if (collapsible) {
    return (
      <details
        className={`group rounded-2xl border-2 border-brand-dark/10 p-5 ${className}`}
      >
        <summary className="flex cursor-pointer items-center justify-between list-none">
          {label}
          <svg
            className="w-4 h-4 text-brand-dark/40 transition-transform group-open:rotate-180"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </summary>
        <nav aria-label="Table of contents" className="mt-4">
          {list}
        </nav>
      </details>
    );
  }

  return (
    <nav aria-label="Table of contents" className={className}>
      <div className="mb-4">{label}</div>
      {list}
    </nav>
  );
}
