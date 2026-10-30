import Link from "next/link";
import { cn } from "@/lib/utils";

type Stat = { label: string; value: React.ReactNode; href?: string };
/** Shared summary strip; links remain links rather than simulated buttons. */
export function StatStrip({
  items,
  className,
}: {
  items: Stat[];
  className?: string;
}) {
  const itemClass =
    "flex min-w-0 flex-1 flex-col gap-[3px] border-r border-border px-2.5 py-3 last:border-r-0 sm:px-[18px] sm:pb-3.5 sm:pt-[15px]";
  return (
    <div
      className={cn(
        "mb-5 flex overflow-hidden rounded-[var(--radius-card)] border border-border bg-card",
        className,
      )}
    >
      {items.map(({ label, value, href }) => {
        const content = (
          <>
            <strong className="text-[23px] font-extrabold leading-[1.1] tracking-[-.03em]">
              {value}
            </strong>
            <span className="break-words text-[9px] font-extrabold uppercase tracking-[.03em] text-muted-foreground sm:text-[10.5px] sm:tracking-[.1em]">
              {label}
            </span>
          </>
        );
        return href ? (
          <Link
            className={cn(itemClass, "hover:bg-accent")}
            key={label}
            href={href}
          >
            {content}
          </Link>
        ) : (
          <div className={itemClass} key={label}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
