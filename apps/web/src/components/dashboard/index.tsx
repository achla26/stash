"use client";

import { useRouter } from "next/navigation";
import {
  FileText,
  Link2,
  BookOpen,
  FileCode,
  ArrowRight,
  Loader2,
} from "lucide-react";

import { useDashboard } from "@/hooks/use-dashboard";
import { useAuth } from "@/hooks/use-auth";
import { timeAgo } from "@/utils";
import { cn } from "@/lib/utils";
import type { RecentItem } from "@repo/contracts/types";

const ITEM_ICONS: Record<string, React.ElementType> = {
  note: FileText,
  link: Link2,
  notebook: BookOpen,
  page: FileCode,
};

const ITEM_COLORS: Record<string, string> = {
  note: "var(--accent-note)",
  link: "var(--accent-link)",
  notebook: "var(--accent-notebook)",
  page: "var(--accent-page)",
};

export function DashboardContent() {
  const router = useRouter();
  const { getUser } = useAuth();
  const user = getUser();

  const { data, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const stats = data?.stats;
  const recentItems = data?.recentItems ?? [];

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Welcome — loomii-style hero */}
      <div className="flex flex-wrap items-start justify-between gap-8">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            Your study space
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground">
            {greeting}, {user?.name ?? "there"}.
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Everything you save — notes, links, words and pads — organised
            and waiting on every device.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={() => router.push("/notes")}
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              Write a note
            </button>
            <button
              onClick={() => router.push("/links")}
              className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Save a link
            </button>
            <button
              onClick={() => router.push("/words")}
              className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Add a word
            </button>
            <button
              onClick={() => router.push("/pad")}
              className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Open a pad
            </button>
          </div>
        </div>

        {recentItems.length > 0 && (
          <div className="relative hidden h-44 w-[21rem] shrink-0 lg:block" aria-hidden>
            {recentItems.slice(0, 3).map((item, i) => {
              const Icon = ITEM_ICONS[item.type] ?? FileText;
              const color = ITEM_COLORS[item.type] ?? "var(--muted-foreground)";
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className={cn(
                    "soft-shadow absolute w-60 rounded-2xl border border-border bg-card p-3",
                    i === 0 && "tilt-l left-0 top-8",
                    i === 1 && "left-10 top-0 z-10",
                    i === 2 && "tilt-r left-20 top-16"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
                      }}
                    >
                      <Icon className="h-4 w-4" style={{ color }} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {item.title || "Untitled"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {timeAgo(item.updatedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* First-run onboarding */}
      {stats &&
        stats.totalNotes +
          stats.totalLinks +
          stats.totalNotebooks +
          stats.totalPads ===
          0 && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-lg font-semibold text-foreground">
              Welcome to Stash
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Your space for learning links, notes, notebooks and quick pads.
              Start with one of these:
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={() => router.push("/links")}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Save your first link
              </button>
              <button
                onClick={() => router.push("/notes")}
                className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Write your first note
              </button>
            </div>
          </div>
        )}

      {/* Quick Actions */}
      {stats && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            Your stash at a glance
          </h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard
              label="Notes"
              count={stats.totalNotes}
              icon={FileText}
              color="var(--accent-note)"
              onClick={() => router.push("/notes")}
            />
            <StatCard
              label="Links"
              count={stats.totalLinks}
              icon={Link2}
              color="var(--accent-link)"
              onClick={() => router.push("/links")}
            />
            <StatCard
              label="Notebooks"
              count={stats.totalNotebooks}
              icon={BookOpen}
              color="var(--accent-notebook)"
              onClick={() => router.push("/notebooks")}
            />
            <StatCard
              label="Pads"
              count={stats.totalPads}
              icon={FileCode}
              color="var(--accent-page)"
              onClick={() => router.push("/pad")}
            />
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">
          Recent Activity
        </h3>
        {recentItems.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No recent activity yet. Start creating!
          </p>
        ) : (
          <div className="space-y-2">
            {recentItems.map((item) => (
              <RecentItemCard key={`${item.type}-${item.id}`} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ===== Sub Components ===== */

function StatCard({
  label,
  count,
  icon: Icon,
  color,
  onClick,
}: {
  label: string;
  count: number;
  icon: React.ElementType;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="card-lift soft-shadow group rounded-2xl border border-border bg-card p-4 text-left"
    >
      <div className="flex items-center justify-between">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{
            backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
          }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <p className="mt-3 text-2xl font-bold text-foreground">{count}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </button>
  );
}

function RecentItemCard({ item }: { item: RecentItem }) {
  const router = useRouter();
  const Icon = ITEM_ICONS[item.type] ?? FileText;
  const color = ITEM_COLORS[item.type] ?? "var(--muted-foreground)";

  const handleClick = () => {
    switch (item.type) {
      case "note":
        router.push(`/notes/${item.id}`);
        break;
      case "link":
        router.push("/links");
        break;
      case "notebook":
        router.push(`/notebooks/${item.id}`);
        break;
      case "page":
        router.push(`/notebooks/${item.id}`);
        break;
    }
  };

  return (
    <button
      onClick={handleClick}
      className="card-lift flex w-full items-center gap-4 rounded-lg border border-border bg-card p-4 text-left"
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        style={{
          backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
        }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="truncate font-medium text-foreground">
          {item.title}
        </h4>
        {item.description && (
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {item.description}
          </p>
        )}
      </div>
      <div className="shrink-0 text-right">
        <span
          className="inline-block rounded px-2 py-0.5 text-xs font-medium capitalize"
          style={{
            backgroundColor: `color-mix(in srgb, ${color} 13%, transparent)`,
            color,
          }}
        >
          {item.type}
        </span>
        <p className="mt-1 text-xs text-muted-foreground">
          {timeAgo(item.updatedAt)}
        </p>
      </div>
    </button>
  );
}