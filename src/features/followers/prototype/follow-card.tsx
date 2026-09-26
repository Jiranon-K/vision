"use client";

// PROTOTYPE — throwaway. Three structurally different follow cards for the end
// of a Published Post. Question: what should following a Creator look like?

import { useEffect, useRef, useState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Spinner } from "@/shared/ui/spinner";
import { cn } from "@/shared/lib/utils";
import {
  AutoHeight,
  Avatar,
  CheckMark,
  CountUp,
  FOLLOWER_COUNT,
  StatePicker,
  useFollowForm,
  type FollowPhase,
} from "./kit";

export interface FollowCardCreator {
  name: string;
  byline?: string;
  initials: string;
}

const PHASES = ["idle", "invalid", "submitting", "sent"] as const satisfies readonly FollowPhase[];
const SMALL_PRINT = "One email per new Post. Stop anytime.";

function firstName(name: string) {
  return name.split(" ")[0];
}

/** Label → spinner → check, morphing in place inside the same button. */
function MorphLabel({ phase, label }: { phase: FollowPhase; label: string }) {
  return (
    <span className="relative inline-grid place-items-center">
      <span
        className={cn(
          "col-start-1 row-start-1 transition-all duration-[var(--duration-fast)]",
          phase === "submitting" || phase === "sent" ? "scale-90 opacity-0" : "opacity-100",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "col-start-1 row-start-1 transition-opacity duration-[var(--duration-fast)]",
          phase === "submitting" ? "opacity-100" : "opacity-0",
        )}
      >
        <Spinner size="sm" />
      </span>
      {phase === "sent" && <CheckMark className="col-start-1 row-start-1 size-5" />}
    </span>
  );
}

function SentMessage({ creator, tone = "light" }: { creator: FollowCardCreator; tone?: "light" | "dark" }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center motion-safe:animate-fade-in">
      <div
        className={cn(
          "grid size-12 place-items-center rounded-full",
          tone === "dark" ? "bg-brand-lime text-brand-dark" : "bg-accent text-accent-foreground",
        )}
      >
        <CheckMark className="size-6" />
      </div>
      <p className={cn("text-xl font-bold", tone === "dark" ? "text-white" : "text-foreground")}>
        Check your inbox to confirm
      </p>
      <p className={cn("max-w-sm text-sm", tone === "dark" ? "text-white/60" : "text-text-muted")}>
        We sent a link to your address. Once you confirm, {firstName(creator.name)}&rsquo;s next Post comes
        straight to you.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// A — Quiet: centred, one line, Apple-calm. Nothing competes with Follow.
// ---------------------------------------------------------------------------
function VariantA({ creator }: { creator: FollowCardCreator }) {
  const form = useFollowForm();
  const busy = form.phase === "submitting";
  const showSent = form.phase === "sent";
  const [settled, setSettled] = useState(false);

  // The button shows its check first; then the card eases to the message.
  useEffect(() => {
    if (!showSent) return;
    const id = window.setTimeout(() => setSettled(true), 450);
    return () => {
      window.clearTimeout(id);
      setSettled(false);
    };
  }, [showSent]);

  return (
    <div className="flex flex-col gap-4">
      <StatePicker options={PHASES} value={form.phase} onChange={form.setPhase} />
      <section className="rounded-3xl border border-border bg-surface px-6 py-12 text-center shadow-soft md:px-16 md:py-16">
        <AutoHeight>
          {showSent && settled ? (
            <SentMessage creator={creator} />
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Avatar initials={creator.initials} className="size-14 text-base" />
              <h2 className="mt-2 text-balance text-2xl font-bold tracking-tight text-foreground md:text-[32px] md:leading-tight">
                Get {firstName(creator.name)}&rsquo;s next Post in your inbox
              </h2>
              {creator.byline && <p className="text-sm text-text-muted">{creator.byline}</p>}
              <form
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  form.submit();
                }}
                className="mt-6 flex w-full max-w-md flex-col gap-3 text-left sm:flex-row sm:items-start"
              >
                <div className="flex-1">
                  <Input
                    type="email"
                    aria-label="Email address"
                    placeholder="you@example.com"
                    value={form.email}
                    disabled={busy || showSent}
                    onChange={(e) => form.setEmail(e.target.value)}
                    error={form.phase === "invalid" ? "Enter an email address like name@example.com" : undefined}
                  />
                </div>
                <Button type="submit" size="sm" className="h-12 min-w-28" aria-busy={busy} disabled={busy || showSent}>
                  <MorphLabel phase={form.phase} label="Follow" />
                </Button>
              </form>
              <p className="text-xs text-text-faint">{SMALL_PRINT}</p>
            </div>
          )}
        </AutoHeight>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// B — Bold: a dark Creator panel with social proof; the form sits beside it.
// ---------------------------------------------------------------------------
function VariantB({ creator }: { creator: FollowCardCreator }) {
  const form = useFollowForm();
  const busy = form.phase === "submitting";

  return (
    <div className="flex flex-col gap-4">
      <StatePicker options={PHASES} value={form.phase} onChange={form.setPhase} />
      <section className="overflow-hidden rounded-[28px] border-2 border-border-strong bg-brand-dark shadow-hard-lg">
        <div className="grid gap-0 md:grid-cols-[1.1fr_1fr]">
          <div className="flex flex-col gap-5 p-8 md:p-10">
            <div className="flex items-center gap-3">
              <Avatar initials={creator.initials} className="size-12 bg-brand-lime text-base text-brand-dark" />
              <div>
                <p className="font-bold text-white">{creator.name}</p>
                {creator.byline && <p className="text-xs text-white/50">{creator.byline}</p>}
              </div>
            </div>
            <h2 className="text-3xl font-black leading-[1.05] tracking-tight text-white md:text-4xl">
              Liked this Post?
              <br />
              <span className="text-brand-lime">Get the next one first.</span>
            </h2>
            <p className="text-sm text-white/60">
              <CountUp to={FOLLOWER_COUNT} className="font-bold text-white" /> Readers already follow{" "}
              {firstName(creator.name)}.
            </p>
          </div>

          <div className="flex flex-col justify-center border-t-2 border-white/10 bg-white/[0.04] p-8 md:border-l-2 md:border-t-0 md:p-10">
            <AutoHeight>
              {form.phase === "sent" ? (
                <SentMessage creator={creator} tone="dark" />
              ) : (
                <form
                  noValidate
                  onSubmit={(e) => {
                    e.preventDefault();
                    form.submit();
                  }}
                  className="flex flex-col gap-3"
                >
                  <label htmlFor="follow-b" className="text-sm font-bold text-white">
                    Your email
                  </label>
                  <input
                    id="follow-b"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    disabled={busy}
                    onChange={(e) => form.setEmail(e.target.value)}
                    aria-invalid={form.phase === "invalid"}
                    className={cn(
                      "h-14 rounded-xl border-2 bg-white/10 px-5 text-lg text-white outline-none transition-colors placeholder:text-white/30",
                      form.phase === "invalid" ? "border-error" : "border-white/15 focus:border-brand-lime",
                    )}
                  />
                  {form.phase === "invalid" && (
                    <p className="text-sm text-error motion-safe:animate-fade-in">Enter an email address like name@example.com</p>
                  )}
                  <Button type="submit" variant="secondary" fullWidth disabled={busy} aria-busy={busy}>
                    <MorphLabel phase={form.phase} label={`Follow ${firstName(creator.name)}`} />
                  </Button>
                  <p className="text-center text-xs text-white/40">{SMALL_PRINT}</p>
                </form>
              )}
            </AutoHeight>
          </div>
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// C — Progressive: one small row that opens into the form, plus a pill that
// follows the Reader down the Post and brings them back to it.
// ---------------------------------------------------------------------------
function VariantC({ creator }: { creator: FollowCardCreator }) {
  const form = useFollowForm();
  const [open, setOpen] = useState(false);
  const [pill, setPill] = useState(false);
  const cardRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = form.phase === "submitting";

  useEffect(() => {
    const onScroll = () => {
      const card = cardRef.current;
      if (!card) return;
      const scrolled = window.scrollY / Math.max(1, document.body.scrollHeight - window.innerHeight);
      const cardVisible = card.getBoundingClientRect().top < window.innerHeight;
      setPill(scrolled > 0.35 && !cardVisible && form.phase !== "sent");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [form.phase]);

  const openForm = () => {
    setOpen(true);
    window.setTimeout(() => inputRef.current?.focus(), 200);
  };

  return (
    <div className="flex flex-col gap-4">
      <StatePicker
        options={PHASES}
        value={form.phase}
        onChange={(p) => {
          setOpen(true);
          form.setPhase(p);
        }}
      />
      <section ref={cardRef} className="rounded-2xl border-2 border-border-strong bg-surface p-2">
        <AutoHeight>
          {form.phase === "sent" ? (
            <div className="p-6">
              <SentMessage creator={creator} />
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-4 p-3">
                <Avatar initials={creator.initials} />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-foreground">{creator.name}</p>
                  <p className="truncate text-sm text-text-muted">New Posts by email · {SMALL_PRINT}</p>
                </div>
                {!open && (
                  <Button size="sm" onClick={openForm}>
                    Follow
                  </Button>
                )}
              </div>
              {open && (
                <form
                  noValidate
                  onSubmit={(e) => {
                    e.preventDefault();
                    form.submit();
                  }}
                  className="flex flex-col gap-3 border-t border-border-subtle p-3 motion-safe:animate-fade-in sm:flex-row sm:items-start"
                >
                  <div className="flex-1">
                    <Input
                      ref={inputRef}
                      type="email"
                      aria-label="Email address"
                      placeholder="you@example.com"
                      value={form.email}
                      disabled={busy}
                      onChange={(e) => form.setEmail(e.target.value)}
                      error={form.phase === "invalid" ? "Enter an email address like name@example.com" : undefined}
                    />
                  </div>
                  <Button type="submit" size="sm" className="h-12 min-w-28" disabled={busy} aria-busy={busy}>
                    <MorphLabel phase={form.phase} label="Follow" />
                  </Button>
                </form>
              )}
            </div>
          )}
        </AutoHeight>
      </section>

      <button
        type="button"
        onClick={() => {
          cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
          openForm();
        }}
        className={cn(
          "fixed bottom-20 right-6 z-50 flex items-center gap-2 rounded-full border-2 border-border-strong bg-surface py-1.5 pl-1.5 pr-4 shadow-hard transition-all duration-[var(--duration-slow)] ease-[var(--ease-out)]",
          pill ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
        )}
      >
        <Avatar initials={creator.initials} className="size-8 text-xs" />
        <span className="text-sm font-bold text-foreground">Follow {firstName(creator.name)}</span>
      </button>
    </div>
  );
}

export function FollowCardPrototype({ variant, creator }: { variant: string; creator: FollowCardCreator }) {
  return (
    <div className="mt-16" data-prototype="follow-card">
      {variant === "A" && <VariantA creator={creator} />}
      {variant === "B" && <VariantB creator={creator} />}
      {variant === "C" && <VariantC creator={creator} />}
    </div>
  );
}
