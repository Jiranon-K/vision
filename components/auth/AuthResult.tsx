import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export interface AuthResultProps {
  ctaLabel: string;
  ctaHref: string;
  /** Quiet action under the primary one. Omit when the screen has none. */
  altLabel?: string;
  onAltClick?: () => void;
}

/**
 * What replaces the form once a screen has resolved. The heading and sub above
 * it come from AuthShell, so a screen switches to its resolved copy by swapping
 * those.
 */
export function AuthResult({
  ctaLabel,
  ctaHref,
  altLabel,
  onAltClick,
}: AuthResultProps) {
  return (
    <div className="mt-7 flex flex-col gap-3.5">
      <Link
        href={ctaHref}
        className={cn(
          buttonVariants({ variant: "default", size: "sm", fullWidth: true }),
          "h-[50px] text-[15px]"
        )}
      >
        {ctaLabel}
      </Link>

      {altLabel ? (
        <button
          type="button"
          onClick={onAltClick}
          className="text-center text-[13.5px] text-text-muted hover:text-foreground"
        >
          {altLabel}
        </button>
      ) : null}
    </div>
  );
}
