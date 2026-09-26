"use client";

// PROTOTYPE — throwaway. Three ways the publish sheet could offer a Delivery.
// Question: how does a Creator decide to deliver a Post to their Followers?

import { useState } from "react";
import { Alert } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Checkbox } from "@/shared/ui/checkbox";
import { cn } from "@/shared/lib/utils";
import {
  CheckMark,
  CountUp,
  DAILY_LIMIT_TODAY,
  FOLLOWER_COUNT,
  MOCK_CREATOR,
  MOCK_POST,
  StatePicker,
} from "./kit";

const SCENARIOS = ["reach", "daily limit", "no Followers", "already delivered"] as const;
type Scenario = (typeof SCENARIOS)[number];

function Switch({ on, onChange, label }: { on: boolean; onChange: (on: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full border-2 border-border-strong transition-colors duration-[var(--duration-base)]",
        on ? "bg-accent" : "bg-surface-muted",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 size-5 rounded-full border-2 border-border-strong bg-surface transition-transform duration-[var(--duration-base)] ease-[var(--ease-out)]",
          on ? "translate-x-[22px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

function LimitNote() {
  return (
    <p className="text-[13px] leading-snug text-info-strong motion-safe:animate-fade-in">
      {DAILY_LIMIT_TODAY} today, the rest tomorrow. Vision sends a set number of emails each day during the
      beta.
    </p>
  );
}

function NoFollowers() {
  return (
    <div className="flex flex-col gap-1 rounded-xl border-2 border-dashed border-border p-4">
      <p className="text-sm font-bold text-foreground">No Followers yet</p>
      <p className="text-[13px] leading-snug text-text-secondary">
        Readers can follow you from the end of every Published Post. Share this one and your first Followers
        will get the next.
      </p>
    </div>
  );
}

function AlreadyDelivered() {
  return (
    <div className="flex flex-col gap-2">
      <Badge tone="success" appearance="subtle" className="w-fit gap-1.5">
        <CheckMark className="size-3.5" /> Delivered to {FOLLOWER_COUNT} Followers
      </Badge>
      <p className="text-[13px] leading-snug text-text-secondary">
        This Post already reached your Followers on Sep 24. Saving changes will not send it again.
      </p>
    </div>
  );
}

// A — a single switch row. The quietest option: on by default, reach below.
function VariantA({ scenario }: { scenario: Scenario }) {
  const [on, setOn] = useState(true);
  if (scenario === "no Followers") return <NoFollowers />;
  if (scenario === "already delivered") return <AlreadyDelivered />;
  return (
    <div className="flex flex-col gap-3 rounded-xl border-2 border-border bg-surface p-4">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <p className="text-[15px] font-bold text-foreground">Deliver to Followers</p>
          <p
            className={cn(
              "text-[13px] text-text-secondary transition-opacity duration-[var(--duration-base)]",
              on ? "opacity-100" : "opacity-50",
            )}
          >
            Reaches <CountUp to={FOLLOWER_COUNT} className="font-bold text-foreground" /> Followers by email
          </p>
        </div>
        <Switch on={on} onChange={setOn} label="Deliver to Followers" />
      </div>
      {on && scenario === "daily limit" && <LimitNote />}
      {!on && (
        <p className="text-[13px] text-text-muted motion-safe:animate-fade-in">
          Published quietly. You can&rsquo;t deliver this Post later.
        </p>
      )}
    </div>
  );
}

// B — publishing itself becomes the choice: two cards, deliver first.
function VariantB({ scenario }: { scenario: Scenario }) {
  const [choice, setChoice] = useState<"deliver" | "quiet">("deliver");
  if (scenario === "no Followers") return <NoFollowers />;
  if (scenario === "already delivered") return <AlreadyDelivered />;
  const options = [
    {
      id: "deliver" as const,
      title: "Publish and deliver",
      body: (
        <>
          Live for every Reader, and emailed to{" "}
          <CountUp to={FOLLOWER_COUNT} className="font-bold text-foreground" /> Followers.
        </>
      ),
    },
    { id: "quiet" as const, title: "Publish quietly", body: <>Live for every Reader. No email goes out, now or later.</> },
  ];
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-bold text-foreground">Your Followers</span>
      <div role="radiogroup" className="flex flex-col gap-2.5">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={choice === o.id}
            onClick={() => setChoice(o.id)}
            className={cn(
              "flex items-start gap-3 rounded-xl border-2 p-3.5 text-left transition-all duration-[var(--duration-base)]",
              choice === o.id
                ? "border-border-strong bg-state-selected shadow-hard-sm"
                : "border-border bg-surface hover:bg-state-hover",
            )}
          >
            <span
              className={cn(
                "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 border-border-strong transition-colors",
                choice === o.id ? "bg-accent" : "bg-surface",
              )}
            >
              {choice === o.id && <span className="size-2 rounded-full bg-brand-dark" />}
            </span>
            <span className="flex flex-col gap-1">
              <strong className="text-[15px] text-foreground">{o.title}</strong>
              <span className="text-[13px] leading-snug text-text-secondary">{o.body}</span>
            </span>
          </button>
        ))}
      </div>
      {choice === "deliver" && scenario === "daily limit" && (
        <Alert tone="info" className="motion-safe:animate-fade-in">
          {DAILY_LIMIT_TODAY} Followers today, the rest tomorrow.
        </Alert>
      )}
    </div>
  );
}

// C — show the Creator the email itself, so the choice is concrete.
function VariantC({ scenario }: { scenario: Scenario }) {
  const [on, setOn] = useState(true);
  if (scenario === "no Followers") return <NoFollowers />;
  if (scenario === "already delivered") return <AlreadyDelivered />;
  return (
    <div className="flex flex-col gap-3">
      <Checkbox
        checked={on}
        onChange={(e) => setOn(e.target.checked)}
        label={`Email this Post to ${FOLLOWER_COUNT} Followers`}
      />
      <div
        className={cn(
          "origin-top rounded-xl border-2 border-border-strong bg-surface shadow-hard-sm transition-all duration-[var(--duration-slow)] ease-[var(--ease-out)]",
          on ? "scale-100 opacity-100" : "pointer-events-none scale-[0.97] opacity-40 grayscale",
        )}
      >
        <div className="flex flex-col gap-0.5 border-b border-border-subtle px-4 py-2.5 text-xs text-text-muted">
          <span>
            <b className="text-foreground">From</b> {MOCK_CREATOR.name} via Vision
          </span>
          <span>
            <b className="text-foreground">To</b> <CountUp to={FOLLOWER_COUNT} /> Followers
          </span>
        </div>
        <div className="flex flex-col gap-1.5 px-4 py-3.5">
          <p className="text-[15px] font-bold leading-snug text-foreground">{MOCK_POST.title}</p>
          <p className="line-clamp-2 text-[13px] text-text-secondary">{MOCK_POST.excerpt}</p>
          <span className="mt-1 w-fit rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">
            Read more
          </span>
        </div>
      </div>
      {on && scenario === "daily limit" && <LimitNote />}
    </div>
  );
}

export function DeliverSectionPrototype({ variant }: { variant: string }) {
  const [scenario, setScenario] = useState<Scenario>("reach");
  return (
    <div className="flex flex-col gap-3" data-prototype="deliver-section">
      <StatePicker options={SCENARIOS} value={scenario} onChange={setScenario} />
      {variant === "A" && <VariantA scenario={scenario} />}
      {variant === "B" && <VariantB scenario={scenario} />}
      {variant === "C" && <VariantC scenario={scenario} />}
    </div>
  );
}
