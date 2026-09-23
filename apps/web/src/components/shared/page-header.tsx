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
          className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-medium text-white gradient-button disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {isActionPending ? "Creating..." : actionLabel}
        </button>
      )}
    </div>
  );
}