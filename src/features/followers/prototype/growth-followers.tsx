"use client";

// PROTOTYPE — throwaway. Three ways Growth Analytics could report Followers and
// the Views that Deliveries bring back.

import { useState } from "react";
import { cn } from "@/shared/lib/utils";
import {
  CountUp,
  FOLLOWER_COUNT,
  FOLLOWER_GROWTH,
  FOLLOWER_WEEKLY_GAIN,
  WEEKLY_VIEWS,
} from "./kit";

const DELIVERY_VIEWS = WEEKLY_VIEWS.reduce((sum, d) => sum + d.delivery, 0);
const OTHER_VIEWS = WEEKLY_VIEWS.reduce((sum, d) => sum + d.other, 0);

function StackedBars({ split = true, height = 180 }: { split?: boolean; height?: number }) {
  const max = Math.max(...WEEKLY_VIEWS.map((d) => d.other + d.delivery));
  return (
    <div className="flex items-end gap-3" style={{ height }}>
      {WEEKLY_VIEWS.map((d, i) => {
        const total = d.other + d.delivery;
        return (
          <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="flex w-full max-w-12 flex-col-reverse overflow-hidden rounded-lg border-2 border-border-strong"
              style={{
                height: `${(total / max) * (height - 28)}px`,
                transformOrigin: "bottom",
                animation: `grow var(--duration-slow) var(--ease-out) ${i * 40}ms both`,
              }}
            >
              <div className="bg-surface-muted" style={{ flex: split ? d.other : total }} />
              {split && d.delivery > 0 && <div className="bg-accent" style={{ flex: d.delivery }} />}
            </div>
            <span className="text-xs text-text-muted">{d.day}</span>
          </div>
        );
      })}
      <style>{"@keyframes grow{from{transform:scaleY(0)}to{transform:scaleY(1)}}@media (prefers-reduced-motion:reduce){[style*='grow']{animation:none!important}}"}</style>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex gap-4 text-xs text-text-secondary">
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded-sm border-2 border-border-strong bg-accent" /> From Deliveries
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded-sm border-2 border-border-strong bg-surface-muted" /> Other Views
      </span>
    </div>
  );
}

// A — two more metric cards beside the existing ones, and a split chart.
function VariantA() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-[28px] border-2 border-border-strong bg-surface p-7">
          <p className="text-sm font-bold text-text-muted">Followers</p>
          <p className="mt-2 text-4xl font-black text-foreground">
            <CountUp to={FOLLOWER_COUNT} />
          </p>
          <p className="mt-1 text-sm text-success-strong">+{FOLLOWER_WEEKLY_GAIN} this week</p>
        </div>
        <div className="rounded-[28px] border-2 border-border-strong bg-surface p-7">
          <p className="text-sm font-bold text-text-muted">Views from Deliveries</p>
          <p className="mt-2 text-4xl font-black text-foreground">
            <CountUp to={DELIVERY_VIEWS} />
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            {Math.round((DELIVERY_VIEWS / (DELIVERY_VIEWS + OTHER_VIEWS)) * 100)}% of this week&rsquo;s Views
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-5 rounded-[28px] border-2 border-border-strong bg-surface p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-lg font-bold text-foreground">Views this week</p>
          <Legend />
        </div>
        <StackedBars />
      </div>
    </div>
  );
}

// B — one band that tells the story: Followers → Delivery → Views.
function VariantB() {
  const steps = [
    { label: "Followers", value: FOLLOWER_COUNT, note: `+${FOLLOWER_WEEKLY_GAIN} this week` },
    { label: "Delivered", value: FOLLOWER_COUNT, note: "Sep 24 · 1 Post" },
    { label: "Came back to read", value: DELIVERY_VIEWS, note: "Views from Deliveries" },
  ];
  return (
    <section className="rounded-[28px] border-2 border-border-strong bg-brand-dark p-8 text-white shadow-hard">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-2xl font-black">Your Audience, reached directly</h2>
        <p className="text-sm text-white/50">Last 7 days</p>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {steps.map((s, i) => (
          <div key={s.label} className="relative rounded-2xl bg-white/[0.06] p-6">
            <p className="text-sm text-white/60">{s.label}</p>
            <p className="mt-1 text-5xl font-black text-brand-lime">
              <CountUp to={s.value} />
            </p>
            <p className="mt-1 text-xs text-white/50">{s.note}</p>
            {i < steps.length - 1 && (
              <span className="absolute -right-3 top-1/2 z-10 hidden size-6 -translate-y-1/2 place-items-center rounded-full bg-brand-lime text-sm font-black text-brand-dark md:grid">
                →
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-brand-lime transition-[width] duration-700 ease-[var(--ease-out)]"
          style={{ width: `${Math.round((DELIVERY_VIEWS / FOLLOWER_COUNT) * 100)}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-white/60">
        {Math.round((DELIVERY_VIEWS / FOLLOWER_COUNT) * 100)}% of your Followers read the Post you delivered.
      </p>
    </section>
  );
}

// C — the chart is the page: a segmented control filters it, compact numbers above.
function VariantC() {
  const [filter, setFilter] = useState<"all" | "delivery" | "growth">("all");
  return (
    <section className="flex flex-col gap-6 rounded-[28px] border-2 border-border-strong bg-surface p-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-text-muted">Followers</p>
            <p className="text-2xl font-black text-foreground">
              <CountUp to={FOLLOWER_COUNT} /> <span className="text-sm font-bold text-success-strong">+{FOLLOWER_WEEKLY_GAIN}</span>
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-text-muted">Views from Deliveries</p>
            <p className="text-2xl font-black text-foreground">
              <CountUp to={DELIVERY_VIEWS} />
            </p>
          </div>
        </div>
        <div role="tablist" className="relative flex rounded-xl border-2 border-border-strong bg-surface-muted p-1">
          {(
            [
              ["all", "All Views"],
              ["delivery", "From Deliveries"],
              ["growth", "Follower growth"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={filter === id}
              onClick={() => setFilter(id)}
              className={cn(
                "relative z-10 rounded-lg px-3 py-1.5 text-sm font-bold transition-colors duration-[var(--duration-base)]",
                filter === id ? "bg-surface text-foreground shadow-hard-sm" : "text-text-secondary hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div key={filter} className="motion-safe:animate-fade-in">
        {filter === "all" && <StackedBars split={false} height={220} />}
        {filter === "delivery" && (
          <>
            <StackedBars height={220} />
            <div className="mt-3">
              <Legend />
            </div>
          </>
        )}
        {filter === "growth" && <GrowthLine />}
      </div>
    </section>
  );
}

function GrowthLine() {
  const max = Math.max(...FOLLOWER_GROWTH);
  const min = Math.min(...FOLLOWER_GROWTH) - 20;
  const pts = FOLLOWER_GROWTH.map((v, i) => `${(i / (FOLLOWER_GROWTH.length - 1)) * 100},${100 - ((v - min) / (max - min)) * 90}`);
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-[220px] w-full">
      <polygon points={`0,100 ${pts.join(" ")} 100,100`} className="fill-accent/40" />
      <polyline
        points={pts.join(" ")}
        fill="none"
        className="stroke-border-strong"
        strokeWidth={2.5}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function GrowthFollowersPrototype({ variant }: { variant: string }) {
  return (
    <div className="mb-8" data-prototype="growth-followers" key={variant}>
      {variant === "A" && <VariantA />}
      {variant === "B" && <VariantB />}
      {variant === "C" && <VariantC />}
    </div>
  );
}
