import * as React from "react";
import { cn } from "@/lib/utils";

type LayoutProps = React.HTMLAttributes<HTMLDivElement>;

export function Page({ className, ...props }: LayoutProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full min-w-0 max-w-[var(--page-width)]",
        className,
      )}
      {...props}
    />
  );
}

export function Section({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return <section className={cn("min-w-0", className)} {...props} />;
}

export function Stack({ className, ...props }: LayoutProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-[var(--space-stack)]",
        className,
      )}
      {...props}
    />
  );
}

export function Grid({ className, ...props }: LayoutProps) {
  return (
    <div
      className={cn("grid min-w-0 gap-[var(--space-grid)]", className)}
      {...props}
    />
  );
}

export function SectionHeader({
  title,
  actions,
  className,
  heading: Heading = "h2",
}: {
  title: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  heading?: "h1" | "h2";
}) {
  return (
    <div
      className={cn(
        "mb-3.5 flex flex-wrap items-center justify-between gap-3",
        className,
      )}
    >
      <Heading className="text-[15px] font-extrabold">{title}</Heading>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
