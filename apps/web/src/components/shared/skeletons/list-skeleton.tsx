import { cn } from "@/lib/utils";

interface ListSkeletonProps {
  count?: number;
  className?: string;
}

export function ListSkeleton({ count = 3, className }: ListSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-3">
                <div className="h-4 w-48 rounded-md bg-accent" />
                <div className="h-4 w-20 rounded-md bg-accent" />
              </div>
              <div className="mb-3 h-3 w-full rounded-md bg-accent" />
              <div className="h-3 w-24 rounded-md bg-accent" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}