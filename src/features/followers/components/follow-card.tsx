"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Spinner } from "@/shared/ui/spinner";
import { cn, initialsOf } from "@/shared/lib/utils";
import { followCreator } from "../api";
import { AutoHeight, CheckMark } from "./motion";

// The end of a Published Post (design C, "Progressive", chosen in
// Jiranon-K/vision#29): one quiet row that opens into the form, and a pill that
// follows the Reader down the Post and brings them back to it.

interface FollowCardProps {
  postId: string;
  creator: { name: string; byline?: string };
}

type Phase = "closed" | "open" | "submitting" | "sent";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SMALL_PRINT = "One email per new Post. Stop anytime.";

const firstName = (name: string) => name.split(" ")[0] || name;

function Initials({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-brand-dark font-bold text-brand-lime",
        className ?? "size-11 text-sm",
      )}
    >
      {initialsOf(name)}
    </span>
  );
}

export default function FollowCard({ postId, creator }: FollowCardProps) {
  const [phase, setPhase] = useState<Phase>("closed");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [pillShown, setPillShown] = useState(false);
  const cardRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // The pill appears once the Reader is well into the Post and the card is
  // still below them; it goes away when the card is in view or they followed.
  useEffect(() => {
    if (phase === "sent") return;
    const update = () => {
      const card = cardRef.current;
      if (!card) return;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
      setPillShown(progress > 0.35 && card.getBoundingClientRect().top > window.innerHeight);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [phase]);

  const open = () => {
    setPhase((p) => (p === "closed" ? "open" : p));
    window.setTimeout(() => inputRef.current?.focus(), 200);
  };

  const submit = async () => {
    if (!EMAIL.test(email.trim())) {
      setError("Enter an email address like name@example.com");
      inputRef.current?.focus();
      return;
    }
    setError(undefined);
    setPhase("submitting");
    const result = await followCreator(postId, email.trim());
    if (result.ok) {
      setPhase("sent");
      return;
    }
    setError(result.message);
    setPhase("open");
  };

  const busy = phase === "submitting";

  return (
    <>
      <section
        ref={cardRef}
        aria-label={`Follow ${creator.name}`}
        className="mt-16 rounded-2xl border-2 border-border-strong bg-surface p-2"
      >
        <AutoHeight>
          {phase === "sent" ? (
            <div role="status" className="flex flex-col items-center gap-2 p-6 text-center motion-safe:animate-fade-in">
              <span className="grid size-12 place-items-center rounded-full bg-accent text-accent-foreground">
                <CheckMark className="size-6" />
              </span>
              <p className="text-xl font-bold text-foreground">Check your inbox to confirm</p>
              <p className="max-w-sm text-sm text-text-muted">
                We sent a link to your address. Once you confirm, {firstName(creator.name)}&rsquo;s next Post comes
                straight to you.
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-4 p-3">
                <Initials name={creator.name} />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-foreground">{creator.name}</p>
                  <p className="text-sm text-text-muted">
                    New Posts by email <span aria-hidden>·</span> {SMALL_PRINT}
                  </p>
                </div>
                {phase === "closed" && (
                  <Button size="sm" onClick={open} aria-expanded={false}>
                    Follow
                  </Button>
                )}
              </div>

              {phase !== "closed" && (
                <form
                  noValidate
                  onSubmit={(e) => {
                    e.preventDefault();
                    void submit();
                  }}
                  className="flex flex-col gap-3 border-t border-border-subtle p-3 motion-safe:animate-fade-in sm:flex-row sm:items-start"
                >
                  <div className="flex-1">
                    <Input
                      ref={inputRef}
                      type="email"
                      autoComplete="email"
                      aria-label="Email address"
                      placeholder="you@example.com"
                      value={email}
                      disabled={busy}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError(undefined);
                      }}
                      error={error}
                    />
                  </div>
                  <Button type="submit" size="sm" className="h-12 min-w-28" disabled={busy} aria-busy={busy}>
                    {busy ? <Spinner size="sm" label="Following" /> : `Follow ${firstName(creator.name)}`}
                  </Button>
                </form>
              )}
            </div>
          )}
        </AutoHeight>
      </section>

      <button
        type="button"
        tabIndex={pillShown ? 0 : -1}
        aria-hidden={!pillShown}
        onClick={() => {
          cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
          open();
        }}
        className={cn(
          "fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border-2 border-border-strong bg-surface py-1.5 pl-1.5 pr-4 shadow-hard",
          "motion-safe:transition-all motion-safe:duration-[var(--duration-slow)] motion-safe:ease-[var(--ease-out)]",
          pillShown ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
        )}
      >
        <Initials name={creator.name} className="size-8 text-xs" />
        <span className="text-sm font-bold text-foreground">Follow {firstName(creator.name)}</span>
      </button>
    </>
  );
}
