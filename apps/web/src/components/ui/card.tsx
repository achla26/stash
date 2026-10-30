import * as React from "react";
import { cn } from "@/lib/utils";

type CardProps = React.HTMLAttributes<HTMLElement> & {
  as?: "div" | "section" | "article";
};
/** A common bordered surface; retain semantic section/article markup when needed. */
export function Card({
  as: Component = "div",
  className,
  ...props
}: CardProps) {
  return (
    <Component
      data-slot="card"
      className={cn(
        "min-w-0 rounded-[var(--radius-card)] border border-border bg-card",
        className,
      )}
      {...props}
    />
  );
}
