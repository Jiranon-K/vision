import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-brand-dark/10", className)}
      {...props}
    />
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="bg-white rounded-[28px] border-2 border-brand-dark p-6 shadow-[6px_6px_0px_0px_#191A23]">
      <Skeleton className="h-4 w-24 mb-4" />
      <Skeleton className="h-10 w-32 mb-4" />
      <Skeleton className="h-4 w-20" />
    </div>
  );
}

export function RecentPostSkeleton() {
  return (
    <div className="flex items-center justify-between bg-white rounded-[20px] border-2 border-brand-dark p-4 shadow-[4px_4px_0px_0px_#191A23]">
      <div className="flex-1 min-w-0">
        <Skeleton className="h-5 w-3/4 mb-2" />
        <div className="flex gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
      <Skeleton className="h-4 w-12 ml-4" />
    </div>
  );
}

export function PostRowSkeleton() {
  return (
    <div className="flex items-center justify-between bg-white rounded-[16px] border-2 border-brand-dark p-4 shadow-[4px_4px_0px_0px_#191A23]">
      <div className="flex-1 min-w-0">
        <Skeleton className="h-6 w-1/2 mb-3" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
      <div className="flex items-center gap-6 ml-4">
        <Skeleton className="h-4 w-20" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-10 rounded-[10px]" />
          <Skeleton className="h-10 w-10 rounded-[10px]" />
        </div>
      </div>
    </div>
  );
}
