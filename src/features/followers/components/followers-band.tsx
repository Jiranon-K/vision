"use client";

import { Skeleton } from "@/shared/ui/skeleton";
import { useFollowerFigures } from "../hooks/use-followers";
import { CountUp, STAGGER_MS } from "./motion";
import type { FollowerFigures } from "../types";

const weekLabel = (weekStart: string) =>
  new Date(`${weekStart}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

// Followers week by week (Jiranon-K/vision#31): eight bars, the week under way
// last and marked as such, each labelled with its count so the chart reads
// without hovering.
function WeeklyBars({ weekly }: { weekly: FollowerFigures["weekly"] }) {
  const max = Math.max(1, ...weekly.map((w) => w.followers));
  return (
    <figure className="mt-8">
      <figcaption className="text-sm text-text-inverse/60">Followers, week by week</figcaption>
      <ol className="mt-4 flex h-40 items-end gap-2">
        {weekly.map((week, i) => {
          const current = i === weekly.length - 1;
          return (
            <li
              key={week.weekStart}
              className="flex h-full flex-1 flex-col items-center justify-end gap-2 motion-safe:animate-rise-in"
              style={{ animationDelay: `${i * STAGGER_MS}ms` }}
              aria-label={`Week of ${weekLabel(week.weekStart)}${current ? " (this week)" : ""}: ${week.followers} Followers`}
            >
              <span aria-hidden className="text-xs font-bold tabular-nums text-text-inverse/80">
                {week.followers}
              </span>
              <span
                aria-hidden
                className={
                  current
                    ? "w-full max-w-10 rounded-md bg-accent"
                    : "w-full max-w-10 rounded-md bg-text-inverse/25"
                }
                style={{ height: `${Math.max(4, (week.followers / max) * 100)}%` }}
              />
              <span aria-hidden className="whitespace-nowrap text-[11px] text-text-inverse/50">
                {current ? "This week" : weekLabel(week.weekStart)}
              </span>
            </li>
          );
        })}
      </ol>
    </figure>
  );
}

// Growth Analytics' Followers band (design B, "Story band", chosen in
// Jiranon-K/vision#29): the Audience a Creator reaches directly, told as one
// line — Followers, Delivered, came back to read.

export default function FollowersBand({ enabled }: { enabled: boolean }) {
  const figures = useFollowerFigures(enabled);

  if (figures.isPending) {
    return <Skeleton className="mb-8 h-64 w-full rounded-2xl" />;
  }
  if (figures.isError || !figures.data) return null;

  const { followers, weeklyGain, delivered, deliveries, viewsFromDeliveries, weekly } = figures.data;
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
    <section className="mb-8 rounded-2xl border-2 border-border-strong bg-surface-inverse p-8 text-text-inverse shadow-hard">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-2xl font-black">Your Audience, reached directly</h2>
        <p className="text-sm text-text-inverse/50">Last 7 days</p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {steps.map((step, i) => (
          <div key={step.label} className="relative rounded-xl bg-text-inverse/5 p-6">
            <p className="text-sm text-text-inverse/60">{step.label}</p>
            <p className="mt-1 text-5xl font-black text-accent">
              <CountUp to={step.value} />
            </p>
            <p className="mt-1 text-xs text-text-inverse/50">{step.note}</p>
            {i < steps.length - 1 && (
              <span
                aria-hidden
                className="absolute -right-3 top-1/2 z-10 hidden size-6 -translate-y-1/2 place-items-center rounded-full bg-accent text-sm font-black text-accent-foreground md:grid"
              >
                →
              </span>
            )}
          </div>
        ))}
      </div>

      {weekly?.length > 0 && <WeeklyBars weekly={weekly} />}

      {delivered > 0 ? (
        <>
          <div
            className="mt-6 h-2 overflow-hidden rounded-full bg-text-inverse/10"
            role="meter"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={share}
            aria-label="Share of delivered emails that brought a Reader back"
          >
            <div
              className="h-full rounded-full bg-accent motion-safe:transition-[width] motion-safe:duration-[var(--duration-slow)] motion-safe:ease-[var(--ease-out)]"
              style={{ width: `${share}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-text-inverse/60">
            {share}% of the emails you delivered brought a Reader back to the Post.
          </p>
        </>
      ) : (
        <p className="mt-6 text-sm text-text-inverse/60">
          Deliver your next Post to your Followers when you publish it, and this is where you&rsquo;ll see them read.
        </p>
      )}
    </section>
  );
}
