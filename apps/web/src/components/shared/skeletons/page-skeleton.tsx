import { StatSkeleton } from "./stat-skeleton";
import { CardSkeleton } from "./card-skeleton";
import { ListSkeleton } from "./list-skeleton";

export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Welcome */}
      <div>
        <div className="mb-2 h-8 w-64 animate-pulse rounded-md bg-accent" />
        <div className="h-4 w-48 animate-pulse rounded-md bg-accent" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatSkeleton key={i} />
        ))}
      </div>

      {/* Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function NotesPageSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 animate-pulse rounded-md bg-accent" />
        <div className="h-10 w-32 animate-pulse rounded-lg bg-accent" />
      </div>

      {/* Search */}
      <div className="h-12 animate-pulse rounded-xl bg-accent" />

      {/* Filter chips */}
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-8 w-20 animate-pulse rounded-full bg-accent"
          />
        ))}
      </div>

      {/* List */}
      <ListSkeleton count={4} />
    </div>
  );
}

export function LinksPageSkeleton() {
  const card = "rounded-2xl border border-border bg-card";
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`${card} animate-pulse p-4`}>
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-20 rounded-md bg-accent" />
              <div className="h-7 w-7 rounded-lg bg-accent" />
            </div>
            <div className="mt-3 h-7 w-10 rounded-md bg-accent" />
            <div className="mt-2 h-3 w-16 rounded-md bg-accent" />
          </div>
        ))}
      </div>

      {/* Your links + top tags */}
      <div className="grid gap-3 lg:grid-cols-[1.7fr_1fr]">
        <div className={`${card} animate-pulse p-5`}>
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 rounded-md bg-accent" />
            <div className="h-8 w-24 rounded-lg bg-accent" />
          </div>
          <div className="mt-4 flex gap-2">
            <div className="h-9 flex-1 rounded-md bg-accent" />
            <div className="h-9 w-28 rounded-md bg-accent" />
          </div>
          <div className="mt-3 flex gap-1.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-6 w-16 rounded-full bg-accent" />
            ))}
          </div>
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 border-t border-border pt-3">
                <div className="h-9 w-9 rounded-lg bg-accent" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-2/3 rounded-md bg-accent" />
                  <div className="h-3 w-1/2 rounded-md bg-accent" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className={`${card} animate-pulse p-5`}>
          <div className="h-4 w-20 rounded-md bg-accent" />
          <div className="mt-4 flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-7 w-16 rounded-full bg-accent" />
            ))}
          </div>
        </div>
      </div>

      {/* Top collections + chart */}
      <div className="grid gap-3 lg:grid-cols-[1fr_1.7fr]">
        <div className={`${card} animate-pulse p-5`}>
          <div className="h-4 w-28 rounded-md bg-accent" />
          <div className="mt-4 space-y-3.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between">
                  <div className="h-3.5 w-16 rounded-md bg-accent" />
                  <div className="h-3.5 w-4 rounded-md bg-accent" />
                </div>
                <div className="h-1.5 rounded-full bg-accent" />
              </div>
            ))}
          </div>
        </div>
        <div className={`${card} animate-pulse p-5`}>
          <div className="h-4 w-40 rounded-md bg-accent" />
          <div className="mt-6 flex h-28 items-end gap-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-md bg-accent"
                style={{ height: `${[35, 55, 25, 70, 45, 90, 60][i]}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TasksPageSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-2 h-8 w-32 animate-pulse rounded-md bg-accent" />
          <div className="h-4 w-48 animate-pulse rounded-md bg-accent" />
        </div>
        <div className="h-10 w-32 animate-pulse rounded-lg bg-accent" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatSkeleton key={i} />
        ))}
      </div>

      {/* Search */}
      <div className="h-12 animate-pulse rounded-xl bg-accent" />

      {/* Filter chips */}
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-8 w-20 animate-pulse rounded-full bg-accent"
          />
        ))}
      </div>

      {/* List */}
      <ListSkeleton count={5} />
    </div>
  );
}