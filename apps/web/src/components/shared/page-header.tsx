import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  isActionPending?: boolean;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actionLabel,
  onAction,
  isActionPending,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="truncate text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          disabled={isActionPending}
          className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          {isActionPending ? "Creating…" : actionLabel}
        </button>
      )}
    </div>
  );
}