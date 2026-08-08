import Link from "next/link";

export interface AuthResultProps {
  ctaLabel: string;
  ctaHref: string;
  /** Quiet second option under the primary action. Omit when the shell's
      footer already offers the only alternative worth showing. */
  altLabel?: string;
  altHref?: string;
  onAltClick?: () => void;
}

/**
 * What replaces the form once a screen has resolved — the dark primary action
 * plus a quiet alternative. The heading and sub above it come from AuthShell,
 * so a screen switches to its resolved copy by swapping those.
 */
export function AuthResult({
  ctaLabel,
  ctaHref,
  altLabel,
  altHref,
  onAltClick,
}: AuthResultProps) {
  return (
    <div className="mt-7 flex flex-col gap-3.5">
      <Link
        href={ctaHref}
        className="block rounded-xl bg-primary py-3.5 text-center font-medium text-primary-foreground shadow-hard transition-all hover:translate-x-1 hover:translate-y-1 hover:bg-primary-hover hover:text-text-on-brand hover:shadow-none"
      >
        {ctaLabel}
      </Link>

      {!altLabel ? null : onAltClick ? (
        <button
          type="button"
          onClick={onAltClick}
          className="text-center text-[13.5px] text-text-muted hover:text-foreground"
        >
          {altLabel}
        </button>
      ) : (
        <Link
          href={altHref ?? "/"}
          className="text-center text-[13.5px] text-text-muted hover:text-foreground"
        >
          {altLabel}
        </Link>
      )}
    </div>
  );
}
