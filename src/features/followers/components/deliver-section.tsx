"use client";

import { Badge } from "@/shared/ui/badge";
import { Checkbox } from "@/shared/ui/checkbox";
import { Skeleton } from "@/shared/ui/skeleton";
import { cn } from "@/shared/lib/utils";
import type { PostDelivery } from "@/features/posts";
import { useFollowerSummary } from "../hooks/use-followers";
import { CheckMark, CountUp } from "./motion";

// The publish sheet's Delivery choice (design C, chosen in Jiranon-K/vision#29):
// a checkbox, and beneath it the email that will actually go out, so the
// decision is about something concrete.

export interface DeliverSectionProps {
  deliver: boolean;
  onDeliverChange: (deliver: boolean) => void;
  /** The Post's Delivery, when it already had one. */
  delivery?: PostDelivery;
  creatorName: string;
  title: string;
  excerpt: string;
}

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function DeliverSection({
  deliver,
  onDeliverChange,
  delivery,
  creatorName,
  title,
  excerpt,
}: DeliverSectionProps) {
  const summary = useFollowerSummary(!delivery);

  if (delivery) {
    return (
      <div className="flex flex-col gap-2">
        <Badge tone="success" appearance="subtle" className="w-fit gap-1.5">
          <CheckMark className="size-3.5" /> Delivered to {delivery.followers} Followers
        </Badge>
        <p className="text-[13px] leading-snug text-text-secondary">
          This Post reached your Followers on {formatDay(delivery.at)}. Saving changes will not send it again.
        </p>
      </div>
    );
  }

  if (summary.isPending) {
    return <Skeleton className="h-24 w-full rounded-xl" />;
  }

  // Without figures, the safe answer is to offer nothing rather than guess.
  if (summary.isError || !summary.data) return null;

  const { followers, sendableToday } = summary.data;

  if (followers === 0) {
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

  const later = Math.max(0, followers - sendableToday);

  return (
    <div className="flex flex-col gap-3">
      <Checkbox
        checked={deliver}
        onChange={(e) => onDeliverChange(e.target.checked)}
        label={`Email this Post to ${followers} Followers`}
        hint="You can't deliver it later if you publish without it."
      />
      <div
        aria-hidden
        className={cn(
          "origin-top rounded-xl border-2 border-border-strong bg-surface shadow-hard-sm",
          "motion-safe:transition-all motion-safe:duration-[var(--duration-slow)] motion-safe:ease-[var(--ease-out)]",
          deliver ? "scale-100 opacity-100" : "scale-[0.97] opacity-40 grayscale",
        )}
      >
        <div className="flex flex-col gap-0.5 border-b border-border-subtle px-4 py-2.5 text-xs text-text-muted">
          <span>
            <b className="text-foreground">From</b> {creatorName} via Vision
          </span>
          <span>
            <b className="text-foreground">To</b> <CountUp to={followers} /> Followers
          </span>
        </div>
        <div className="flex flex-col gap-1.5 px-4 py-3.5">
          <p className="text-[15px] font-bold leading-snug text-foreground">{title || "Untitled Post"}</p>
          {excerpt && <p className="line-clamp-2 text-[13px] text-text-secondary">{excerpt}</p>}
          <span className="mt-1 w-fit rounded-lg border-2 border-border-strong bg-accent px-3 py-1.5 text-xs font-bold text-accent-foreground">
            Read more
          </span>
        </div>
      </div>
      {deliver && later > 0 && (
        <p className="text-[13px] leading-snug text-info-strong motion-safe:animate-fade-in">
          {Math.min(followers, sendableToday)} today, the rest tomorrow. Vision sends a set number of emails each
          day during the beta.
        </p>
      )}
    </div>
  );
}
