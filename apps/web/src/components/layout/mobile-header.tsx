"use client";

import { Menu, Infinity } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-sidebar px-4 md:hidden">
      {/* Menu Button */}
      <button
        onClick={onMenuClick}
        aria-label="Open menu"
        className="rounded-lg p-2 text-foreground transition-colors hover:bg-accent"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
          <Infinity className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-bold text-foreground">Stash</span>
      </div>

      {/* Spacer for centering logo */}
      <div className="w-9" />
    </header>
  );
}