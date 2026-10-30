import * as React from "react";
import { Card } from "@/components/ui/card";

export function EditorOptionPanel({ children }: { children: React.ReactNode }) {
  return <Card as="section" className="p-[18px] [&_h2]:mb-2.5 [&_h2]:text-[13px] [&_h2]:font-extrabold [&_label]:mb-[5px] [&_label]:mt-3 [&_label]:block [&_label]:text-xs [&_label]:font-bold [&_label]:text-muted-foreground [&_select]:min-h-[var(--control-height)] [&_select]:w-full [&_select]:rounded-[var(--radius-control)] [&_select]:border [&_select]:border-input [&_select]:bg-card [&_select]:p-2 [&_select]:text-[13px] [&_select]:text-foreground">{children}</Card>;
}
