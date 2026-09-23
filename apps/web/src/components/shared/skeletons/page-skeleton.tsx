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
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 animate-pulse rounded-md bg-accent" />
        <div className="h-10 w-32 animate-pulse rounded-lg bg-accent" />
      </div>

      {/* Search */}
      <div className="h-12 animate-pulse rounded-xl bg-accent" />

      {/* Collection bar */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-9 w-24 animate-pulse rounded-sm bg-accent"
          />
        ))}
      </div>

      {/* Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl border border-border bg-card">
            <div className="h-32 bg-accent" />
            <div className="space-y-2 p-4">
              <div className="h-4 w-3/4 rounded-md bg-accent" />
              <div className="h-3 w-full rounded-md bg-accent" />
              <div className="h-3 w-1/2 rounded-md bg-accent" />
            </div>
          </div>
        ))}
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