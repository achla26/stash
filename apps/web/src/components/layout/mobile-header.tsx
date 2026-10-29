"use client";

import { Menu } from "lucide-react";

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
          <svg viewBox="0 0 32 32" width="19" height="19" fill="currentColor" aria-hidden="true"><rect x="3" y="5" width="20" height="5" rx="2.5"/><rect x="7" y="13" width="20" height="5" rx="2.5" opacity=".8"/><rect x="11" y="21" width="16" height="5" rx="2.5" opacity=".6"/></svg>
        </div>
        <span className="font-serif text-lg font-bold text-foreground">Stash</span>
      </div>

      {/* Spacer for centering logo */}
      <div className="w-9" />
    </header>
  );
}