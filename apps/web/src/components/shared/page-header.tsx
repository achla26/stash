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
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div>
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          disabled={isActionPending}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {isActionPending ? "Creating..." : actionLabel}
        </button>
      )}
    </div>
  );
}