export function ReviewProgress({
  index,
  total,
  known,
}: {
  index: number;
  total: number;
  known: number;
}) {
  const percentage = total > 0 ? Math.min(100, (index / total) * 100) : 0;
  return (
    <div className="w-full max-w-[540px] text-xs text-muted-foreground">
      <div className="flex justify-between gap-2">
        <span>
          Card {index + 1} of {total}
        </span>
        <span>{known} known</span>
      </div>
      <div
        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-accent"
        role="progressbar"
        aria-label="Review progress"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={index}
      >
        <div
          className="h-full bg-primary"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
