"use client";

// PROTOTYPE — throwaway. The pages a Reader lands on from an email (confirmed,
// link expired, stopped following) and the two emails themselves, in three
// structurally different treatments.

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import { Avatar, CheckMark, MOCK_CREATOR, MOCK_POST, StatePicker } from "./kit";

const SCREENS = ["confirmed", "link expired", "stopped", "email: confirm", "email: delivery"] as const;
type Screen = (typeof SCREENS)[number];

const creator = MOCK_CREATOR;
const first = creator.name.split(" ")[0];

interface PageCopy {
  icon: "check" | "clock" | "wave";
  title: string;
  body: string;
  primary: string;
  secondary?: string;
}

function pageCopy(screen: Screen): PageCopy {
  if (screen === "link expired") {
    return {
      icon: "clock",
      title: "This link has already been used or expired",
      body: `Confirmation links work once, for 48 hours. If you still want ${first}'s new Posts, follow again from the Post and we'll send a fresh link.`,
      primary: "Back to the Post",
    };
  }
  if (screen === "stopped") {
    return {
      icon: "wave",
      title: `You won't receive more Posts from ${creator.name}`,
      body: "Your address has been removed from their Followers. Nothing else changes; you can still read on Vision any time.",
      primary: "Back to Vision",
      secondary: "Changed your mind? Follow again",
    };
  }
  return {
    icon: "check",
    title: `You now follow ${creator.name}`,
    body: `${first}'s next Post will arrive in your inbox. Every email has a one-click link to stop.`,
    primary: "Back to the Post",
  };
}

function PageIcon({ icon, className }: { icon: PageCopy["icon"]; className?: string }) {
  return (
    <div className={cn("grid place-items-center rounded-full", className)}>
      {icon === "check" && <CheckMark className="size-1/2" />}
      {icon === "clock" && <span className="text-[1.6em]">⏱</span>}
      {icon === "wave" && <span className="text-[1.6em]">👋</span>}
    </div>
  );
}

// ---------------------------------------------------------------- pages ----

function PageA({ copy }: { copy: PageCopy }) {
  return (
    <div className="grid min-h-[620px] place-items-center bg-surface-muted px-4 py-16">
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-3xl bg-surface px-8 py-12 text-center shadow-soft motion-safe:animate-panel-in">
        <PageIcon
          icon={copy.icon}
          className={cn("size-16 text-2xl", copy.icon === "check" ? "bg-accent text-accent-foreground" : "bg-surface-muted")}
        />
        <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground">{copy.title}</h1>
        <p className="text-[15px] leading-relaxed text-text-secondary">{copy.body}</p>
        <Button size="sm" className="mt-3">
          {copy.primary}
        </Button>
        {copy.secondary && (
          <button type="button" className="text-sm text-text-muted underline-offset-4 hover:underline">
            {copy.secondary}
          </button>
        )}
      </div>
    </div>
  );
}

function PageB({ copy }: { copy: PageCopy }) {
  return (
    <div className="grid min-h-[620px] md:grid-cols-2">
      <div className="flex flex-col justify-between gap-10 bg-brand-dark p-10 text-white">
        <span className="text-xl font-black">
          Vision<span className="text-brand-lime">.</span>
        </span>
        <div className="flex flex-col gap-4">
          <Avatar initials={creator.initials} className="size-16 bg-brand-lime text-lg text-brand-dark" />
          <p className="text-3xl font-black leading-tight">{creator.name}</p>
          <p className="max-w-xs border-l-2 border-brand-lime pl-3 text-sm italic text-white/60">&ldquo;{creator.byline}&rdquo;</p>
        </div>
        <p className="text-xs text-white/40">Posts delivered by Vision</p>
      </div>
      <div className="flex flex-col justify-center gap-5 bg-surface p-10 md:p-16">
        <PageIcon
          icon={copy.icon}
          className="size-14 border-2 border-border-strong bg-accent text-xl text-accent-foreground shadow-hard-sm motion-safe:animate-panel-in"
        />
        <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-foreground">{copy.title}</h1>
        <p className="max-w-md text-base text-text-secondary">{copy.body}</p>
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="secondary" size="sm">
            {copy.primary}
          </Button>
          {copy.secondary && (
            <button type="button" className="text-sm font-bold text-foreground underline underline-offset-4">
              {copy.secondary}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PageC({ copy }: { copy: PageCopy }) {
  return (
    <div className="flex min-h-[620px] flex-col items-center justify-center gap-10 bg-surface px-6 py-16">
      <div className="flex max-w-2xl flex-col items-center gap-4 text-center motion-safe:animate-fade-in">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-text-muted">
          {copy.icon === "check" ? "Confirmed" : copy.icon === "clock" ? "Link expired" : "Stopped following"}
        </p>
        <h1 className="text-balance text-5xl font-black leading-[1.02] tracking-tight text-foreground md:text-6xl">
          {copy.title}
        </h1>
        <p className="max-w-lg text-lg text-text-secondary">{copy.body}</p>
      </div>
      {/* The Post they came from is the call to action. */}
      <a
        href="#"
        onClick={(e) => e.preventDefault()}
        className="group flex w-full max-w-lg items-center gap-4 rounded-2xl border-2 border-border-strong bg-surface p-4 shadow-hard transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none motion-safe:animate-panel-in"
      >
        <Avatar initials={creator.initials} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-xs text-text-muted">{copy.primary}</span>
          <span className="truncate font-bold text-foreground">{MOCK_POST.title}</span>
        </span>
        <span className="text-xl transition-transform group-hover:translate-x-1">→</span>
      </a>
      {copy.secondary && <button className="text-sm text-text-muted underline underline-offset-4">{copy.secondary}</button>}
    </div>
  );
}

// --------------------------------------------------------------- emails ----

const EMAIL_CASES = ["standard", "long title", "no cover"] as const;
type EmailCase = (typeof EMAIL_CASES)[number];

const LONG_TITLE =
  "Why the Readers You Keep Matter More Than the Readers You Reach: Notes From a Year of Writing Without an Algorithm";

function Inbox({ from, subject, width, children }: { from: string; subject: string; width: number; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2" style={{ width }}>
      <div className="rounded-t-xl border-2 border-b-0 border-border bg-surface-muted px-4 py-2.5 text-xs text-text-secondary">
        <p>
          <b className="text-foreground">{from}</b> &lt;posts@vision.app&gt;
        </p>
        <p className="truncate">{subject}</p>
      </div>
      <div className="-mt-2 overflow-hidden rounded-b-xl border-2 border-border bg-[#f4f4f1]">{children}</div>
      <p className="text-center font-mono text-[11px] text-text-faint">{width}px</p>
    </div>
  );
}

function Cover() {
  return (
    <div className="aspect-[16/8] w-full bg-[linear-gradient(135deg,#b9ff66_0%,#191a23_100%)]" aria-label="Cover image" />
  );
}

function ConfirmEmail({ variant }: { variant: string }) {
  const body = `Confirm you want ${first}'s new Posts by email.`;
  const note = "This link expires in 48 hours. If you didn't ask to follow, ignore this email and nothing happens.";
  if (variant === "B") {
    return (
      <div className="bg-surface">
        <div className="bg-brand-dark px-8 py-6 text-lg font-black text-white">
          {creator.name} <span className="text-brand-lime">via Vision</span>
        </div>
        <div className="flex flex-col gap-5 px-8 py-8">
          <p className="text-xl font-bold text-foreground">{body}</p>
          <span className="w-fit rounded-xl border-2 border-border-strong bg-brand-lime px-6 py-3 font-bold text-brand-dark shadow-hard-sm">
            Confirm follow
          </span>
          <p className="text-xs text-text-muted">{note}</p>
        </div>
      </div>
    );
  }
  if (variant === "C") {
    return (
      <div className="flex flex-col gap-4 bg-surface px-8 py-8 font-serif text-[15px] leading-relaxed text-foreground">
        <p>Hi,</p>
        <p>
          You asked to receive new Posts from {creator.name}. <a className="font-bold underline">Confirm follow</a> and the next
          one will come straight here.
        </p>
        <p className="text-sm text-text-muted">{note}</p>
        <p className="text-sm text-text-muted">— Vision, on behalf of {first}</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-4 bg-surface px-8 py-10 text-center">
      <Avatar initials={creator.initials} className="size-12 text-sm" />
      <p className="text-lg font-bold text-foreground">{body}</p>
      <span className="rounded-full bg-primary px-7 py-3 text-sm font-bold text-primary-foreground">Confirm follow</span>
      <p className="max-w-xs text-xs text-text-muted">{note}</p>
    </div>
  );
}

function DeliveryEmail({ variant, emailCase }: { variant: string; emailCase: EmailCase }) {
  const title = emailCase === "long title" ? LONG_TITLE : MOCK_POST.title;
  const cover = emailCase !== "no cover";
  const footer = (
    <p className="text-center text-[11px] leading-relaxed text-text-muted">
      You follow {creator.name} on Vision.{" "}
      <a className="underline">Stop following</a>
    </p>
  );
  if (variant === "B") {
    return (
      <div className="bg-surface">
        <div className="flex items-center gap-3 bg-brand-dark px-6 py-5">
          <Avatar initials={creator.initials} className="size-10 bg-brand-lime text-xs text-brand-dark" />
          <div>
            <p className="font-bold text-white">{creator.name}</p>
            <p className="text-xs text-white/50">{creator.byline}</p>
          </div>
        </div>
        {cover && <Cover />}
        <div className="flex flex-col gap-3 px-6 py-7">
          <span className="w-fit rounded-full bg-brand-lime px-2.5 py-0.5 text-[11px] font-bold text-brand-dark">New Post · {MOCK_POST.readTime}</span>
          <p className="text-2xl font-black leading-tight text-foreground">{title}</p>
          <p className="line-clamp-4 text-[15px] leading-relaxed text-text-secondary">{MOCK_POST.excerpt}</p>
          <span className="mt-2 w-fit rounded-xl border-2 border-border-strong bg-brand-lime px-6 py-3 font-bold text-brand-dark shadow-hard-sm">
            Read more
          </span>
        </div>
        <div className="border-t border-border-subtle px-6 py-5">{footer}</div>
      </div>
    );
  }
  if (variant === "C") {
    return (
      <div className="flex flex-col gap-4 bg-surface px-7 py-8 font-serif text-foreground">
        <p className="text-sm text-text-muted">
          {creator.name} published a new Post · {MOCK_POST.readTime}
        </p>
        <p className="text-2xl font-bold leading-snug">{title}</p>
        {cover && <Cover />}
        <p className="text-[15px] leading-relaxed">{MOCK_POST.excerpt}</p>
        <a className="text-[15px] font-bold underline underline-offset-4">Read more →</a>
        <p className="border-t border-border-subtle pt-4 text-sm italic text-text-muted">
          — {creator.name}, {creator.byline.toLowerCase()}
        </p>
        {footer}
      </div>
    );
  }
  return (
    <div className="bg-surface">
      <div className="flex flex-col items-center gap-1 px-6 pb-4 pt-8 text-center">
        <Avatar initials={creator.initials} className="size-10 text-xs" />
        <p className="mt-1 text-sm font-bold text-foreground">{creator.name}</p>
        <p className="text-xs text-text-muted">{creator.byline}</p>
      </div>
      {cover && (
        <div className="px-6">
          <div className="overflow-hidden rounded-2xl">
            <Cover />
          </div>
        </div>
      )}
      <div className="flex flex-col items-center gap-3 px-8 py-7 text-center">
        <p className="text-balance text-2xl font-bold leading-tight tracking-tight text-foreground">{title}</p>
        <p className="line-clamp-4 text-[15px] leading-relaxed text-text-secondary">{MOCK_POST.excerpt}</p>
        <span className="mt-2 rounded-full bg-primary px-7 py-3 text-sm font-bold text-primary-foreground">Read more</span>
        <p className="text-xs text-text-faint">{MOCK_POST.readTime}</p>
      </div>
      <div className="border-t border-border-subtle px-6 py-5">{footer}</div>
    </div>
  );
}

function Emails({ variant, kind }: { variant: string; kind: "confirm" | "delivery" }) {
  const [emailCase, setEmailCase] = useState<EmailCase>("standard");
  const subject =
    kind === "confirm" ? `Confirm you want ${first}'s new Posts` : emailCase === "long title" ? LONG_TITLE : MOCK_POST.title;
  const from = `${creator.name} via Vision`;
  return (
    <div className="flex flex-col items-center gap-6 bg-surface-muted px-4 py-10">
      {kind === "delivery" && <StatePicker label="Email case" options={EMAIL_CASES} value={emailCase} onChange={setEmailCase} />}
      <div className="flex flex-wrap items-start justify-center gap-10">
        {[600, 375].map((w) => (
          <Inbox key={w} from={from} subject={subject} width={w}>
            {kind === "confirm" ? <ConfirmEmail variant={variant} /> : <DeliveryEmail variant={variant} emailCase={emailCase} />}
          </Inbox>
        ))}
      </div>
    </div>
  );
}

export function PublicPagesPrototype({ variant }: { variant: string }) {
  const [screen, setScreen] = useState<Screen>("confirmed");
  const copy = pageCopy(screen);
  return (
    <div data-prototype="public-pages">
      <div className="flex justify-center border-b border-border-subtle bg-surface px-4 py-3">
        <StatePicker label="Screen" options={SCREENS} value={screen} onChange={setScreen} />
      </div>
      <div key={`${variant}-${screen}`}>
        {screen === "email: confirm" && <Emails variant={variant} kind="confirm" />}
        {screen === "email: delivery" && <Emails variant={variant} kind="delivery" />}
        {!screen.startsWith("email") && variant === "A" && <PageA copy={copy} />}
        {!screen.startsWith("email") && variant === "B" && <PageB copy={copy} />}
        {!screen.startsWith("email") && variant === "C" && <PageC copy={copy} />}
      </div>
    </div>
  );
}
