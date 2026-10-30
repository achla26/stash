import * as React from "react";

export function ReviewCard({
  title,
  children,
  icon,
}: {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[250px] w-full max-w-[540px] flex-col justify-center rounded-[var(--radius-dialog)] border border-border bg-background px-5 py-10 sm:px-9">
      {icon}
      <h2 className="break-words font-serif text-[clamp(30px,5vw,38px)] font-bold">
        {title}
      </h2>
      {children}
    </div>
  );
}
