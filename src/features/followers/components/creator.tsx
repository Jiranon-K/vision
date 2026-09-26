import { cn, initialsOf } from "@/shared/lib/utils";

// How the Followers screens name a Creator to a Reader: by first name in a
// sentence, and by initials in a circle.

export const firstName = (name: string): string => name.split(" ")[0] || name;

export function CreatorInitials({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-surface-inverse font-bold text-accent",
        className ?? "size-11 text-sm",
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
