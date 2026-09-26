"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { buttonVariants } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import { cn, initialsOf } from "@/shared/lib/utils";
import { confirmFollow, stopFollowing, type LinkResult } from "../api";
import type { FollowOutcome } from "../types";
import { CheckMark } from "./motion";

// Where a link in a Follower email lands (design B, "Bold", chosen in
// Jiranon-K/vision#29): the Creator on a dark panel, the outcome beside it.

type Kind = "confirm" | "stop";

interface Copy {
  title: string;
  body: string;
  action: { label: string; href: string };
  secondary?: { label: string; href: string };
  icon: "check" | "clock" | "wave" | "alert";
}

const postHref = (slug: string) => `/blog/${encodeURIComponent(slug)}`;

function copyFor(kind: Kind, result: LinkResult): Copy {
  if (result.state === "failed") {
    return {
      icon: "alert",
      title: "Something went wrong",
      body: "Vision couldn't finish that just now. Open the link from your email again in a moment.",
      action: { label: "Go to Vision", href: "/blog" },
    };
  }
  if (result.state === "expired") {
    return {
      icon: "clock",
      title: "This link has already been used or expired",
      body: "Confirmation links work once, for 48 hours. If you still want new Posts by email, follow again from the end of any Post and we'll send a fresh link.",
      action: { label: "Browse the blog", href: "/blog" },
    };
  }
  const outcome = result.outcome;
  const name = outcome?.creator.name ?? "this Creator";
  const first = name.split(" ")[0];
  if (kind === "stop") {
    return {
      icon: "wave",
      title: `You won't receive more Posts from ${name}`,
      body: "Your address has been removed from their Followers. You can still read on Vision any time.",
      action: { label: "Back to Vision", href: "/blog" },
      secondary: outcome
        ? { label: "Changed your mind? Follow again", href: postHref(outcome.post.slug) }
        : undefined,
    };
  }
  return {
    icon: "check",
    title: `You now follow ${name}`,
    body: `${first}'s next Post will arrive in your inbox. Every email has a one-click link to stop.`,
    action: outcome
      ? { label: "Back to the Post", href: postHref(outcome.post.slug) }
      : { label: "Browse the blog", href: "/blog" },
  };
}

function Icon({ icon }: { icon: Copy["icon"] }) {
  return (
    <span className="grid size-14 place-items-center rounded-full border-2 border-border-strong bg-accent text-xl text-accent-foreground shadow-hard-sm motion-safe:animate-panel-in">
      {icon === "check" && <CheckMark className="size-7" />}
      {icon === "clock" && <span aria-hidden>⏱</span>}
      {icon === "wave" && <span aria-hidden>👋</span>}
      {icon === "alert" && <span aria-hidden>!</span>}
    </span>
  );
}

function CreatorPanel({ outcome }: { outcome?: FollowOutcome }) {
  return (
    <div className="flex flex-col justify-between gap-10 bg-brand-dark p-8 text-white md:p-10">
      <Link href="/" className="text-xl font-black">
        Vision<span className="text-brand-lime">.</span>
      </Link>
      {outcome ? (
        <div className="flex flex-col gap-4 motion-safe:animate-fade-in">
          <span className="grid size-16 place-items-center rounded-full bg-brand-lime text-lg font-bold text-brand-dark">
            {initialsOf(outcome.creator.name)}
          </span>
          <p className="text-3xl font-black leading-tight">{outcome.creator.name}</p>
          {outcome.creator.byline && (
            <p className="max-w-xs border-l-2 border-brand-lime pl-3 text-sm italic text-white/60">
              &ldquo;{outcome.creator.byline}&rdquo;
            </p>
          )}
        </div>
      ) : (
        <p className="text-3xl font-black leading-tight">
          Posts, delivered by the people who write them.
        </p>
      )}
      <p className="text-xs text-white/40">Posts delivered by Vision</p>
    </div>
  );
}

export default function FollowLinkPage({ kind }: { kind: Kind }) {
  const token = useSearchParams().get("token") ?? "";
  const [result, setResult] = useState<LinkResult>();
  // A link is spent by its first use; React's development double-mount must
  // not be the second.
  const used = useRef(false);

  useEffect(() => {
    if (used.current) return;
    used.current = true;
    const act = kind === "confirm" ? confirmFollow : stopFollowing;
    void (token ? act(token) : Promise.resolve<LinkResult>({ state: "expired" })).then(setResult);
  }, [kind, token]);

  const copy = result && copyFor(kind, result);
  const outcome = result?.state === "done" ? result.outcome : undefined;

  return (
    <main className="grid min-h-screen bg-surface md:grid-cols-2">
      <CreatorPanel outcome={outcome} />
      <section aria-live="polite" className="flex flex-col justify-center gap-5 p-8 md:p-16">
        {!copy ? (
          <div className="flex items-center gap-3 text-text-secondary">
            <Spinner size="md" label={null} />
            {kind === "confirm" ? "Confirming your follow…" : "Stopping…"}
          </div>
        ) : (
          <>
            <Icon icon={copy.icon} />
            <h1 className="text-balance text-4xl font-black leading-[1.05] tracking-tight text-foreground motion-safe:animate-fade-in">
              {copy.title}
            </h1>
            <p className="max-w-md text-base text-text-secondary">{copy.body}</p>
            <div className="flex flex-wrap items-center gap-4">
              <Link href={copy.action.href} className={buttonVariants({ variant: "secondary", size: "sm" })}>
                {copy.action.label}
              </Link>
              {copy.secondary && (
                <Link
                  href={copy.secondary.href}
                  className={cn("text-sm font-bold text-foreground underline underline-offset-4")}
                >
                  {copy.secondary.label}
                </Link>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
