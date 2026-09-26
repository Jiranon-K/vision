"use client";

// PROTOTYPE — throwaway. The floating bar that flips a page between design
// variants via `?variant=`. Never rendered in a production build.

import { Suspense, useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export interface PrototypeVariant {
  key: string;
  name: string;
}

export const PROTOTYPE_VARIANTS: PrototypeVariant[] = [
  { key: "A", name: "Quiet" },
  { key: "B", name: "Bold" },
  { key: "C", name: "Progressive" },
];

export function usePrototypeVariant(): string {
  const params = useSearchParams();
  const value = params.get("variant")?.toUpperCase();
  return PROTOTYPE_VARIANTS.some((v) => v.key === value) ? value! : "A";
}

function Bar({ variants }: { variants: PrototypeVariant[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = usePrototypeVariant();
  const index = Math.max(0, variants.findIndex((v) => v.key === current));

  const go = useCallback(
    (step: number) => {
      const next = variants[(index + step + variants.length) % variants.length];
      const query = new URLSearchParams(params.toString());
      query.set("variant", next.key);
      router.replace(`${pathname}?${query.toString()}`, { scroll: false });
    },
    [index, params, pathname, router, variants],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) {
        return;
      }
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const active = variants[index];

  return (
    <div
      data-prototype-switcher
      className="fixed bottom-5 left-1/2 z-[1000] flex -translate-x-1/2 items-center gap-1 rounded-full bg-[#ff3d81] p-1 text-white shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
    >
      <button
        type="button"
        aria-label="Previous variant"
        onClick={() => go(-1)}
        className="grid size-9 place-items-center rounded-full text-lg hover:bg-white/20"
      >
        ←
      </button>
      <span className="min-w-44 px-2 text-center font-mono text-sm font-bold">
        PROTOTYPE · {active.key} ({active.name})
      </span>
      <button
        type="button"
        aria-label="Next variant"
        onClick={() => go(1)}
        className="grid size-9 place-items-center rounded-full text-lg hover:bg-white/20"
      >
        →
      </button>
    </div>
  );
}

export function PrototypeSwitcher({ variants = PROTOTYPE_VARIANTS }: { variants?: PrototypeVariant[] }) {
  if (process.env.NODE_ENV === "production") return null;
  return (
    <Suspense fallback={null}>
      <Bar variants={variants} />
    </Suspense>
  );
}
