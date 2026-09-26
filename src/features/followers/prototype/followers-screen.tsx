"use client";

// PROTOTYPE — throwaway. Three layouts for the Creator's Followers screen in
// the Smart Creator Hub. Question: how should a Creator see and own their list?

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Skeleton } from "@/shared/ui/skeleton";
import { cn } from "@/shared/lib/utils";
import {
  CountUp,
  FOLLOWER_COUNT,
  FOLLOWER_GROWTH,
  FOLLOWER_WEEKLY_GAIN,
  MOCK_FOLLOWERS,
  Reveal,
  StatePicker,
  formatSince,
} from "./kit";

const STATES = ["loaded", "empty", "loading"] as const;
type ScreenState = (typeof STATES)[number];

const OWNERSHIP = "Your Followers are yours. Export them any time and take them anywhere.";

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className={className} aria-hidden>
      <path d="M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M5 19h14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ExportButton({ variant = "default" as "default" | "outline" | "secondary", full = false }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      size="sm"
      variant={variant}
      fullWidth={full}
      onClick={() => {
        setDone(true);
        window.setTimeout(() => setDone(false), 1800);
      }}
    >
      <DownloadIcon className="size-4" />
      {done ? "followers.csv saved" : "Export CSV"}
    </Button>
  );
}

function Sparkline({ values, className }: { values: number[]; className?: string }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const points = values
    .map((v, i) => `${(i / (values.length - 1)) * 100},${34 - ((v - min) / Math.max(1, max - min)) * 30}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 36" preserveAspectRatio="none" className={className} aria-hidden>
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        strokeLinecap="round"
        pathLength={1}
        className="[stroke-dasharray:1] [stroke-dashoffset:1] motion-safe:animate-[draw_900ms_var(--ease-out)_forwards] motion-reduce:[stroke-dashoffset:0]"
      />
      <style>{"@keyframes draw{to{stroke-dashoffset:0}}"}</style>
    </svg>
  );
}

function EmptyState({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-3 px-6 py-16 text-center", className)}>
      <div className="grid size-14 place-items-center rounded-2xl border-2 border-border-strong bg-accent text-2xl shadow-hard-sm">
        ✉
      </div>
      <p className="text-lg font-bold text-foreground">No Followers yet</p>
      <p className="max-w-sm text-sm text-text-secondary">
        Readers can follow you from the end of every Published Post. Once one confirms, they appear here.
      </p>
    </div>
  );
}

function LoadingRows({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col divide-y divide-border-subtle">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center justify-between px-6 py-4">
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

// A — Apple-calm: one big number, a quiet line, then the list.
function VariantA({ state }: { state: ScreenState }) {
  const count = state === "empty" ? 0 : FOLLOWER_COUNT;
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 px-8 py-10">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-text-muted">Followers</p>
          {state === "loading" ? (
            <Skeleton className="mt-3 h-16 w-40" />
          ) : (
            <p className="mt-1 text-7xl font-black tracking-tight text-foreground">
              <CountUp to={count} />
            </p>
          )}
          {state === "loaded" && (
            <p className="mt-2 text-sm text-text-secondary">
              <span className="font-bold text-success-strong">+{FOLLOWER_WEEKLY_GAIN}</span> this week
            </p>
          )}
        </div>
        {state === "loaded" && (
          <div className="flex flex-col items-end gap-2">
            <ExportButton variant="outline" />
            <p className="max-w-60 text-right text-xs text-text-muted">{OWNERSHIP}</p>
          </div>
        )}
      </header>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-soft">
        {state === "empty" && <EmptyState />}
        {state === "loading" && <LoadingRows />}
        {state === "loaded" && (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border-subtle text-xs uppercase tracking-wide text-text-muted">
                <th className="px-6 py-3 font-bold">Email</th>
                <th className="px-6 py-3 text-right font-bold">Following since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {MOCK_FOLLOWERS.map((f, i) => (
                <Reveal as="tr" key={f.email} index={i} className="hover:bg-state-hover">
                  <td className="px-6 py-4 text-[15px] text-foreground">{f.email}</td>
                  <td className="px-6 py-4 text-right text-sm tabular-nums text-text-muted">{formatSince(f.since)}</td>
                </Reveal>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

// B — split: a stats column that owns export, the list with search beside it.
function VariantB({ state }: { state: ScreenState }) {
  const [query, setQuery] = useState("");
  const rows = MOCK_FOLLOWERS.filter((f) => f.email.includes(query.toLowerCase()));
  return (
    <div className="grid gap-6 p-8 lg:grid-cols-[320px_1fr]">
      <aside className="flex flex-col gap-6">
        <div className="rounded-[28px] border-2 border-border-strong bg-brand-dark p-7 text-white shadow-hard">
          <p className="text-sm font-bold text-white/60">Followers</p>
          {state === "loading" ? (
            <Skeleton className="mt-3 h-12 w-32 bg-white/10" />
          ) : (
            <p className="mt-2 text-6xl font-black text-brand-lime">
              <CountUp to={state === "empty" ? 0 : FOLLOWER_COUNT} />
            </p>
          )}
          {state === "loaded" && (
            <>
              <Sparkline values={FOLLOWER_GROWTH} className="mt-5 h-14 w-full text-brand-lime" />
              <p className="mt-3 text-sm text-white/60">
                <span className="font-bold text-white">+{FOLLOWER_WEEKLY_GAIN}</span> in the last 7 days
              </p>
            </>
          )}
        </div>
        <div className="flex flex-col gap-3 rounded-[28px] border-2 border-border-strong bg-accent p-6 shadow-hard">
          <p className="text-lg font-black leading-tight text-accent-foreground">Your list, not ours.</p>
          <p className="text-sm text-accent-foreground/80">{OWNERSHIP}</p>
          <ExportButton full />
        </div>
      </aside>

      <section className="flex flex-col overflow-hidden rounded-[28px] border-2 border-border-strong bg-surface">
        <div className="flex items-center gap-3 border-b-2 border-border-strong p-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Followers"
            disabled={state !== "loaded"}
            className="h-11 flex-1 rounded-xl border-2 border-border bg-surface-muted px-4 text-sm outline-none focus:border-border-strong"
          />
          <Badge tone="neutral" appearance="outline">
            {state === "loaded" ? rows.length : 0} shown
          </Badge>
        </div>
        {state === "empty" && <EmptyState />}
        {state === "loading" && <LoadingRows />}
        {state === "loaded" && (
          <ul className="divide-y divide-border-subtle">
            {rows.map((f, i) => (
              <Reveal as="li" key={f.email} index={i} className="flex items-center gap-4 px-5 py-3.5">
                <span className="grid size-9 place-items-center rounded-full bg-surface-muted text-sm font-bold uppercase text-text-secondary">
                  {f.email[0]}
                </span>
                <span className="flex-1 truncate text-[15px] text-foreground">{f.email}</span>
                <span className="text-sm tabular-nums text-text-muted">{formatSince(f.since)}</span>
              </Reveal>
            ))}
            {rows.length === 0 && <li className="px-5 py-10 text-center text-sm text-text-muted">No Follower matches “{query}”.</li>}
          </ul>
        )}
      </section>
    </div>
  );
}

// C — a timeline: Followers grouped by the week they arrived.
function VariantC({ state }: { state: ScreenState }) {
  const groups = [
    { label: "This week", items: MOCK_FOLLOWERS.slice(0, 5) },
    { label: "Last week", items: MOCK_FOLLOWERS.slice(5, 8) },
    { label: "Earlier in September", items: MOCK_FOLLOWERS.slice(8) },
  ];
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-8 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-border-strong bg-surface p-5 shadow-hard-sm">
        <div className="flex items-baseline gap-3">
          {state === "loading" ? (
            <Skeleton className="h-9 w-24" />
          ) : (
            <span className="text-4xl font-black text-foreground">
              <CountUp to={state === "empty" ? 0 : FOLLOWER_COUNT} />
            </span>
          )}
          <span className="text-text-secondary">Followers</span>
          {state === "loaded" && (
            <Badge tone="success" appearance="subtle">
              +{FOLLOWER_WEEKLY_GAIN} this week
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden max-w-52 text-xs text-text-muted md:block">{OWNERSHIP}</span>
          <ExportButton variant="secondary" />
        </div>
      </div>

      {state === "empty" && <EmptyState className="rounded-2xl border-2 border-dashed border-border" />}
      {state === "loading" && <LoadingRows rows={5} />}
      {state === "loaded" &&
        groups.map((g, gi) => (
          <section key={g.label} className="relative pl-8">
            <span className="absolute left-2 top-2 bottom-0 w-0.5 bg-border-subtle" aria-hidden />
            <span className="absolute left-0 top-1 size-4 rounded-full border-2 border-border-strong bg-accent" aria-hidden />
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-text-muted">
              {g.label} · {g.items.length}
            </h3>
            <ul className="flex flex-col gap-2">
              {g.items.map((f, i) => (
                <Reveal
                  as="li"
                  key={f.email}
                  index={gi * 4 + i}
                  className="flex items-center justify-between rounded-xl bg-surface px-4 py-3 shadow-soft"
                >
                  <span className="text-[15px] text-foreground">{f.email}</span>
                  <span className="text-xs tabular-nums text-text-muted">{formatSince(f.since)}</span>
                </Reveal>
              ))}
            </ul>
          </section>
        ))}
    </div>
  );
}

export function FollowersScreenPrototype({ variant }: { variant: string }) {
  const [state, setState] = useState<ScreenState>("loaded");
  return (
    <div data-prototype="followers-screen">
      <div className="px-8 pt-6">
        <StatePicker options={STATES} value={state} onChange={setState} className="w-fit" />
      </div>
      {/* key: replays the entrance on every variant or state switch */}
      <div key={`${variant}-${state}`}>
        {variant === "A" && <VariantA state={state} />}
        {variant === "B" && <VariantB state={state} />}
        {variant === "C" && <VariantC state={state} />}
      </div>
    </div>
  );
}
