import {
  PostRowSkeleton,
  RecentPostSkeleton,
  Skeleton,
  StatsCardSkeleton,
} from "vision";

export const Primitive = () => (
  <div style={{ display: "grid", gap: 10, maxWidth: 360 }}>
    <Skeleton className="h-6 w-3/4" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-2/3" />
  </div>
);

export const StatsCard = () => (
  <div style={{ maxWidth: 260 }}>
    <StatsCardSkeleton />
  </div>
);

export const RecentPost = () => (
  <div style={{ maxWidth: 460 }}>
    <RecentPostSkeleton />
  </div>
);

export const PostRow = () => (
  <div style={{ maxWidth: 720 }}>
    <PostRowSkeleton />
  </div>
);
