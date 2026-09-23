"use client";

import { Plus } from "lucide-react";

export function QuickAddButton() {
  return (
    <button
      aria-label="Quick add"
      className="fixed bottom-24 right-5 md:bottom-6 md:right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full shadow-lg shadow-primary/40 gradient-button transition-all duration-200 hover:scale-105 hover:shadow-primary/50 active:scale-95"
    >
      <Plus className="h-6 w-6 text-white" />
    </button>
  );
}