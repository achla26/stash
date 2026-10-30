import { Button } from "@/components/ui/button";
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
        className
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
        <Button
          type="button"
          onClick={onAction}
          disabled={isActionPending}
          className="shrink-0 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          {isActionPending ? "Creating…" : actionLabel}
        </Button>
      )}
    </div>
  );
}
