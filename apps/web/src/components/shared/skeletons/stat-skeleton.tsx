import { cn } from "@/lib/utils";

interface StatSkeletonProps {
  className?: string;
}

export function StatSkeleton({ className }: StatSkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl border border-border bg-card p-4 md:p-5",
        className
      )}
    >
      <div className="mb-3 h-10 w-10 rounded-lg bg-accent" />
      <div className="mb-2 h-6 w-16 rounded-md bg-accent" />
      <div className="h-3 w-24 rounded-md bg-accent" />
    </div>
  );
}