import type { PostCreator } from "@/lib/post-contract";
import { cn } from "@/shared/lib/utils";

const VARIANTS = {
  card: { name: "font-medium text-foreground", byline: "text-text-muted" },
  featured: { name: "font-medium text-white", byline: "text-white/60" },
  page: { name: "font-semibold text-foreground", byline: "text-text-muted" },
};

interface CreatorBylineProps {
  creator: PostCreator;
  variant?: keyof typeof VARIANTS;
}

export default function CreatorByline({ creator, variant = "card" }: CreatorBylineProps) {
  const styles = VARIANTS[variant];

  return (
    <div className="min-w-0">
      <p className={cn("text-sm", styles.name)}>{creator.name}</p>
      {creator.byline && (
        <p
          data-byline
          className={cn(
            "mt-1 border-l-2 border-accent pl-2 text-xs italic motion-safe:animate-slide-in",
            styles.byline,
          )}
        >
          &ldquo;{creator.byline}&rdquo;
        </p>
      )}
    </div>
  );
}
