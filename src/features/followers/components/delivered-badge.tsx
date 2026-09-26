import type { PostDelivery } from "@/features/posts";
import { Badge } from "@/shared/ui/badge";
import { CheckMark } from "./motion";

// A Post's one Delivery, said the same way wherever it is shown: the publish
// sheet and the Posts list.
export default function DeliveredBadge({ delivery, size = "md" }: { delivery: PostDelivery; size?: "sm" | "md" }) {
  const followers = delivery.followers;
  return (
    <Badge tone="success" appearance="subtle" size={size} className="w-fit shrink-0 gap-1.5 font-medium">
      <CheckMark className="size-3.5" />
      {followers === 0 ? "Delivered to no Followers" : `Delivered to ${followers} ${followers === 1 ? "Follower" : "Followers"}`}
    </Badge>
  );
}
