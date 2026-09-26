"use client";

import { useState } from "react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { Alert } from "@/shared/ui/alert";
import { downloadFollowersCsv } from "../api";
import { useFollowers, useFollowerSummary } from "../hooks/use-followers";
import type { FollowerRow } from "../types";
import { CountUp, STAGGER_MS } from "./motion";

// The Creator's Followers in the Smart Creator Hub (design C, "Timeline",
// chosen in Jiranon-K/vision#29): how many, how many this week, and who, grouped
// by the week they arrived. The list is theirs to take anywhere (ADR 0009).

const DAY_MS = 24 * 60 * 60 * 1000;
const OWNERSHIP = "Your Followers are yours. Export them any time and take them anywhere.";

interface Group {
  label: string;
  items: FollowerRow[];
}

function groupByArrival(rows: FollowerRow[], now = Date.now()): Group[] {
  const groups = new Map<string, FollowerRow[]>();
  for (const row of rows) {
    const at = new Date(row.since);
    const age = now - at.getTime();
    const label =
      age < 7 * DAY_MS
        ? "This week"
        : age < 14 * DAY_MS
          ? "Last week"
          : at.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    groups.set(label, [...(groups.get(label) ?? []), row]);
  }
  return [...groups].map(([label, items]) => ({ label, items }));
}

const formatSince = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function ExportButton({ disabled }: { disabled: boolean }) {
  const [state, setState] = useState<"idle" | "busy" | "failed">("idle");
  return (
    <Button
      size="sm"
      variant="secondary"
      disabled={disabled || state === "busy"}
      loading={state === "busy"}
      onClick={async () => {
        setState("busy");
        setState((await downloadFollowersCsv()) ? "idle" : "failed");
      }}
    >
      {state === "failed" ? "Try export again" : "Export CSV"}
    </Button>
  );
}

export default function FollowersScreen() {
  const list = useFollowers();
  const summary = useFollowerSummary();
  const rows = list.data ?? [];
  const loading = list.isPending || summary.isPending;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-8 py-10">
      <div>
        <h1 className="text-3xl font-black text-foreground">Followers</h1>
        <p className="mt-1 text-text-muted">Readers who asked for your new Posts by email.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-border-strong bg-surface p-5 shadow-hard-sm">
        <div className="flex items-baseline gap-3">
          {loading ? (
            <Skeleton className="h-9 w-24" />
          ) : (
            <span className="text-4xl font-black text-foreground">
              <CountUp to={summary.data?.followers ?? rows.length} />
            </span>
          )}
          <span className="text-text-secondary">Followers</span>
          {!loading && (summary.data?.weeklyGain ?? 0) > 0 && (
            <Badge tone="success" appearance="subtle">
              +{summary.data!.weeklyGain} this week
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden max-w-52 text-xs text-text-muted md:block">{OWNERSHIP}</span>
          <ExportButton disabled={loading || rows.length === 0} />
        </div>
      </div>

      {list.isError && <Alert tone="error">Your Followers couldn&rsquo;t be loaded. Refresh to try again.</Alert>}

      {loading && (
        <div className="flex flex-col gap-2" aria-busy="true">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      )}

      {!loading && !list.isError && rows.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border px-6 py-16 text-center">
          <span className="grid size-14 place-items-center rounded-2xl border-2 border-border-strong bg-accent text-2xl shadow-hard-sm">
            ✉
          </span>
          <p className="text-lg font-bold text-foreground">No Followers yet</p>
          <p className="max-w-sm text-sm text-text-secondary">
            Readers can follow you from the end of every Published Post. Once one confirms, they appear here.
          </p>
        </div>
      )}

      {!loading &&
        groupByArrival(rows).map((group, gi) => (
          <section key={group.label} className="relative pl-8">
            <span aria-hidden className="absolute bottom-0 left-2 top-2 w-0.5 bg-border-subtle" />
            <span aria-hidden className="absolute left-0 top-1 size-4 rounded-full border-2 border-border-strong bg-accent" />
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-text-muted">
              {group.label} · {group.items.length}
            </h2>
            <ul className="flex flex-col gap-2">
              {group.items.map((row, i) => (
                <li
                  key={row.email}
                  className="flex items-center justify-between gap-4 rounded-xl bg-surface px-4 py-3 shadow-soft motion-safe:animate-rise-in"
                  style={{ animationDelay: `${Math.min(gi * 4 + i, 20) * STAGGER_MS}ms` }}
                >
                  <span className="truncate text-[15px] text-foreground">{row.email}</span>
                  <span className="shrink-0 text-xs tabular-nums text-text-muted">{formatSince(row.since)}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
    </div>
  );
}
