import * as React from "react";
import { Card } from "@/components/ui/card";

export function EditorOptionPanel({ children }: { children: React.ReactNode }) {
  return (
    <Card as="section" className="p-[18px]">
      {children}
    </Card>
  );
}
