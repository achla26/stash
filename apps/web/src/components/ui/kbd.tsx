import * as React from "react";
import { cn } from "@/lib/utils";
export function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(
        "whitespace-nowrap rounded-[5px] border border-b-2 border-border bg-accent px-1.5 py-px text-[10.5px]",
        className,
      )}
      {...props}
    />
  );
}
