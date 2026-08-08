import Link from "next/link";
import { LogoIcon } from "@/components/ui/Icons";

const BRAND_FACETS = ["Posts", "Analytics", "Editor"];

/**
 * The dark half of the card. Hidden below `lg`, where the lockup takes over.
 *
 * `ink-950` rather than a semantic surface on purpose: this panel is the brand
 * mark, dark in both themes, and everything on it is pinned to that fill — the
 * design system's decorative-fill exception to the no-primitives rule.
 */
function BrandPanel() {
  return (
    <div className="relative hidden w-[41%] shrink-0 flex-col justify-between overflow-hidden bg-ink-950 p-11 lg:flex">
      <div className="pointer-events-none absolute -bottom-40 -left-36 size-[420px] rounded-full bg-accent opacity-15 blur-[120px]" />

      <div className="relative flex items-center gap-2.5">
        <LogoIcon className="size-6 text-accent" />
        <span className="text-[22px] font-bold tracking-tight text-white">
          Vision
        </span>
      </div>

      <div className="relative">
        <p className="text-[31px] font-medium leading-[1.18] tracking-tight text-white text-pretty">
          Refracting ideas into <span className="text-accent">digital reality</span>.
        </p>
        <p className="mt-4 max-w-[34ch] text-sm leading-relaxed text-white/55 text-pretty">
          Write, publish and measure — the whole studio behind one account.
        </p>
      </div>

      <div className="relative flex gap-6 font-mono text-[10.5px] uppercase tracking-[0.1em] text-white/40">
        {BRAND_FACETS.map((facet) => (
          <span key={facet}>{facet}</span>
        ))}
      </div>
    </div>
  );
}

/** Full-card dark panel for a screen that cannot render its form yet. */
function PendingPanel() {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-4 bg-ink-950"
      role="status"
    >
      <LogoIcon className="size-12 animate-pulse text-accent" />
      <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/50">
        Checking session
      </span>
    </div>
  );
}

export interface AuthCrossLink {
  /** Lead-in text before the link, e.g. "New to Vision?". */
  note: string;
  label: string;
  href: string;
}

export interface AuthShellProps {
  heading: string;
  sub: string;
  /**
   * The cross-link under the form. Omit it once a screen has resolved: a
   * Creator who just signed in only bounces off the other auth screens.
   */
  crossLink?: AuthCrossLink;
  /**
   * Swaps the whole card for the pending panel — the session check on login
   * and register, the Suspense fallback on the screens that read a token.
   */
  pending?: boolean;
  children: React.ReactNode;
}

/**
 * The frame every auth screen sits in: brand panel, heading block, whatever the
 * screen puts in the middle, and the cross-link footer. Screens own their form
 * and their states; the shell owns the layout and the copy around it.
 */
export function AuthShell({
  heading,
  sub,
  crossLink,
  pending = false,
  children,
}: AuthShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-muted p-4 sm:p-8">
      <div className="flex w-full max-w-[1040px] overflow-hidden rounded-[18px] border border-border bg-surface shadow-panel lg:min-h-[660px]">
        {pending ? (
          <PendingPanel />
        ) : (
          <>
            <BrandPanel />

            <div className="flex min-w-0 flex-1 flex-col justify-center px-6 py-9 sm:px-13 sm:py-14">
              <Link
                href="/"
                className="mb-7 inline-flex w-fit items-center gap-2 lg:hidden"
              >
                <LogoIcon className="size-6 text-accent" />
                <span className="text-xl font-bold tracking-tight text-foreground">
                  Vision
                </span>
              </Link>

              <div className="mx-auto w-full max-w-[392px]">
                <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-foreground">
                  {heading}
                </h1>
                <p className="mt-2 text-[14.5px] leading-relaxed text-text-muted text-pretty">
                  {sub}
                </p>

                {children}

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-5">
                  {crossLink ? (
                    <p className="text-[13.5px] text-text-muted">
                      {crossLink.note}{" "}
                      <Link
                        href={crossLink.href}
                        className="border-b-[1.5px] border-accent pb-px font-medium text-foreground"
                      >
                        {crossLink.label}
                      </Link>
                    </p>
                  ) : (
                    <span />
                  )}
                  <Link href="/" className="text-[12.5px] text-text-faint">
                    ← Back to home
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
