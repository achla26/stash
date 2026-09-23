"use client";

import { Plus } from "lucide-react";

export function QuickAddButton() {
  return (
    <button
      aria-label="Quick add"
      className="fixed bottom-24 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_24px_var(--primary-glow)] transition-all duration-200 hover:scale-105 hover:bg-primary-hover active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:bottom-6 md:right-6"
    >
      <Plus className="h-6 w-6 text-white" />
    </button>
  );
}