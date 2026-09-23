import { cn } from "@/lib/utils";

interface CardSkeletonProps {
  className?: string;
}

export function CardSkeleton({ className }: CardSkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl border border-border bg-card p-4",
        className
      )}
    >
      {/* Title */}
      <div className="mb-3 h-4 w-3/4 rounded-md bg-accent" />

      {/* Description lines */}
      <div className="mb-2 h-3 w-full rounded-md bg-accent" />
      <div className="mb-4 h-3 w-2/3 rounded-md bg-accent" />

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="h-3 w-20 rounded-md bg-accent" />
        <div className="h-3 w-16 rounded-md bg-accent" />
      </div>
    </div>
  );
}