"use client";

import { useEffect, useState } from "react";
import { Search, Command, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { SearchDialog } from "@/components/search/search-dialog";

export function TopBar({ onToggleSidebar }: { onToggleSidebar?: () => void } = {}) {
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
    <header className="hidden h-16 shrink-0 items-center justify-between border-b border-border bg-background px-6 md:flex">
      <button
        onClick={onToggleSidebar}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        aria-label="Toggle sidebar"
        title="Hide/show sidebar"
      >
        <Menu className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-3">
        <ThemeToggle />

        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2 text-muted-foreground transition-colors hover:border-primary"
        >
          <Search className="h-4 w-4" />
          <span className="text-sm">Search...</span>
          <kbd className="ml-8 flex items-center gap-1 rounded bg-accent px-1.5 py-0.5 text-xs text-muted-foreground">
            <Command className="h-3 w-3" />
            <span>K</span>
          </kbd>
        </button>
      </div>

    </header>
    <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
