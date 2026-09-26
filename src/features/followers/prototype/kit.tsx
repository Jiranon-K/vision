"use client";

// PROTOTYPE — throwaway. Mock data and motion helpers shared by the Followers
// design variants. Nothing here talks to the API.

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/shared/lib/utils";
import { usePrefersReducedMotion } from "@/shared/hooks/use-prefers-reduced-motion";

export const MOCK_CREATOR = {
  name: "Mara Lindqvist",
  byline: "Writes about search, slowly and on purpose",
  initials: "ML",
};

export const MOCK_POST = {
  title: "Write Once, Broadcast Everywhere",
  excerpt:
    "Every channel wants its own version of your work. Here is how to keep one source of truth and still meet Readers where they already are.",
  readTime: "6 min read",
  slug: "write-once-broadcast-everywhere",
};

export const MOCK_FOLLOWERS = [
  { email: "nok.pattama@gmail.com", since: "2026-09-25" },
  { email: "j.ekstrom@proton.me", since: "2026-09-24" },
  { email: "somchai.w@outlook.com", since: "2026-09-24" },
  { email: "hello@lenaparks.studio", since: "2026-09-22" },
  { email: "arthit.k@gmail.com", since: "2026-09-21" },
  { email: "mei.tanaka@icloud.com", since: "2026-09-19" },
  { email: "d.okafor@fastmail.com", since: "2026-09-18" },
  { email: "pim.s@hey.com", since: "2026-09-15" },
  { email: "r.almeida@gmail.com", since: "2026-09-11" },
  { email: "kanya.r@yahoo.com", since: "2026-09-09" },
];

export const FOLLOWER_COUNT = 248;
export const FOLLOWER_WEEKLY_GAIN = 12;
export const DAILY_LIMIT_TODAY = 180;

// Weekly Views, split by where the read came from.
export const WEEKLY_VIEWS = [
  { day: "Mon", other: 120, delivery: 0 },
  { day: "Tue", other: 138, delivery: 0 },
  { day: "Wed", other: 110, delivery: 96 },
  { day: "Thu", other: 150, delivery: 64 },
  { day: "Fri", other: 142, delivery: 22 },
  { day: "Sat", other: 90, delivery: 8 },
  { day: "Sun", other: 104, delivery: 4 },
];

export const FOLLOWER_GROWTH = [180, 191, 199, 210, 222, 236, 248];

export function formatSince(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Counts up to `to` once when first rendered; final value at once under reduced motion. */
export function useCountUp(to: number, duration = 700): number {
  const reduced = usePrefersReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (reduced) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(to * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [to, duration, reduced]);

  return reduced ? to : value;
}

export function CountUp({ to, className }: { to: number; className?: string }) {
  const value = useCountUp(to);
  return <span className={cn("tabular-nums", className)}>{value.toLocaleString("en-US")}</span>;
}

/** Fades and rises its child in, `index` steps of 35ms after mount. Cross-fade only under reduced motion. */
export function Reveal({
  index = 0,
  children,
  className,
  as: Tag = "div",
}: {
  index?: number;
  children: ReactNode;
  className?: string;
  as?: "div" | "li" | "tr";
}) {
  const reduced = usePrefersReducedMotion();
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setShown(true), 30 + index * 35);
    return () => window.clearTimeout(id);
  }, [index]);
  const style: CSSProperties = {
    opacity: shown ? 1 : 0,
    transform: shown || reduced ? "none" : "translateY(8px)",
    transition: "opacity var(--duration-slow) var(--ease-out), transform var(--duration-slow) var(--ease-out)",
  };
  return (
    <Tag className={className} style={style}>
      {children}
    </Tag>
  );
}

/** Eases its height to fit whatever it currently holds, so state changes morph instead of jumping. */
export function AutoHeight({ children, className }: { children: ReactNode; className?: string }) {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const [height, setHeight] = useState<number | "auto">("auto");
  useEffect(() => {
    if (!node) return;
    const ro = new ResizeObserver(([entry]) => setHeight(entry.contentRect.height));
    ro.observe(node);
    return () => ro.disconnect();
  }, [node]);
  return (
    <div
      className={cn("overflow-hidden", className)}
      style={{ height, transition: "height var(--duration-slow) var(--ease-out)" }}
    >
      <div ref={setNode}>{children}</div>
    </div>
  );
}

/** The dashed control that picks which state a prototype shows. Not part of any design. */
export function StatePicker<T extends string>({
  label = "Prototype state",
  options,
  value,
  onChange,
  className,
}: {
  label?: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 rounded-xl border-2 border-dashed border-[#ff3d81] bg-[#fff0f6] p-1.5 font-mono text-xs text-[#a3004a]",
        className,
      )}
    >
      <span className="px-1.5 font-bold uppercase tracking-wide">{label}</span>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            "rounded-lg px-2.5 py-1 transition-colors",
            value === option ? "bg-[#ff3d81] text-white" : "hover:bg-[#ffd6e7]",
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export function Avatar({ initials, className }: { initials: string; className?: string }) {
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-brand-dark font-bold text-brand-lime",
        className ?? "size-11 text-sm",
      )}
    >
      {initials}
    </div>
  );
}

export function CheckMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className={className} aria-hidden>
      <style>{"@keyframes draw{to{stroke-dashoffset:0}}"}</style>
      <path
        d="M5 12.5l4.5 4.5L19 7.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="[stroke-dasharray:24] [stroke-dashoffset:24] motion-safe:animate-[draw_300ms_var(--ease-out)_forwards] motion-reduce:[stroke-dashoffset:0]"
      />
    </svg>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type FollowPhase = "idle" | "invalid" | "submitting" | "sent";

/** The Reader's follow form, simulated: validate, pretend to send, then report the same message for every address. */
export function useFollowForm() {
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<FollowPhase>("idle");

  const submit = () => {
    if (!EMAIL_RE.test(email.trim())) {
      setPhase("invalid");
      return;
    }
    setPhase("submitting");
    window.setTimeout(() => setPhase("sent"), 900);
  };

  return {
    email,
    setEmail: (v: string) => {
      setEmail(v);
      if (phase === "invalid") setPhase("idle");
    },
    phase,
    setPhase,
    submit,
    reset: () => {
      setEmail("");
      setPhase("idle");
    },
  };
}
