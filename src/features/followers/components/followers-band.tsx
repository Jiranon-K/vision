"use client";

import { Skeleton } from "@/shared/ui/skeleton";
import { useFollowerFigures } from "../hooks/use-followers";
import { CountUp } from "./motion";

// Growth Analytics' Followers band (design B, "Story band", chosen in
// Jiranon-K/vision#29): the Audience a Creator reaches directly, told as one
// line — Followers, Delivered, came back to read.

export default function FollowersBand({ enabled }: { enabled: boolean }) {
  const figures = useFollowerFigures(enabled);

  if (figures.isPending) {
    return <Skeleton className="mb-8 h-64 w-full rounded-[28px]" />;
  }
  if (figures.isError || !figures.data) return null;

  const { followers, weeklyGain, delivered, deliveries, viewsFromDeliveries } = figures.data;
  // Of the emails delivered this week, how many brought a Reader back.
  const share = delivered > 0 ? Math.min(100, Math.round((viewsFromDeliveries / delivered) * 100)) : 0;

  const steps = [
    { label: "Followers", value: followers, note: weeklyGain > 0 ? `+${weeklyGain} this week` : "No new Followers this week" },
    {
      label: "Delivered",
      value: delivered,
      note: deliveries === 0 ? "No Deliveries this week" : `${deliveries} ${deliveries === 1 ? "Post" : "Posts"} this week`,
    },
    { label: "Came back to read", value: viewsFromDeliveries, note: "Views from Deliveries" },
  ];

  return (
    <section className="mb-8 rounded-[28px] border-2 border-border-strong bg-brand-dark p-8 text-white shadow-hard">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-2xl font-black">Your Audience, reached directly</h2>
        <p className="text-sm text-white/50">Last 7 days</p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {steps.map((step, i) => (
          <div key={step.label} className="relative rounded-2xl bg-white/[0.06] p-6">
            <p className="text-sm text-white/60">{step.label}</p>
            <p className="mt-1 text-5xl font-black text-brand-lime">
              <CountUp to={step.value} />
            </p>
            <p className="mt-1 text-xs text-white/50">{step.note}</p>
            {i < steps.length - 1 && (
              <span
                aria-hidden
                className="absolute -right-3 top-1/2 z-10 hidden size-6 -translate-y-1/2 place-items-center rounded-full bg-brand-lime text-sm font-black text-brand-dark md:grid"
              >
                →
              </span>
            )}
          </div>
        ))}
      </div>

      {delivered > 0 ? (
        <>
          <div
            className="mt-6 h-2 overflow-hidden rounded-full bg-white/10"
            role="meter"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={share}
            aria-label="Share of delivered emails that brought a Reader back"
          >
            <div
              className="h-full origin-left rounded-full bg-brand-lime motion-safe:transition-[width] motion-safe:duration-700 motion-safe:ease-[var(--ease-out)]"
              style={{ width: `${share}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-white/60">
            {share}% of the emails you delivered brought a Reader back to the Post.
          </p>
        </>
      ) : (
        <p className="mt-6 text-sm text-white/60">
          Deliver your next Post to your Followers when you publish it, and this is where you&rsquo;ll see them read.
        </p>
      )}
    </section>
  );
}
