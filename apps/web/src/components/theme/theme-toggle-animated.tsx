"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

export function ThemeToggleAnimated() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative flex h-9 w-16 items-center rounded-full border px-1 transition-all duration-300",
        isDark
          ? "border-border bg-surface-muted"
          : "border-amber-300 bg-amber-100"
      )}
      aria-label="Toggle theme"
    >
      {/* Slider */}
      <div
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-full transition-all duration-300",
          isDark
            ? "translate-x-0 bg-primary text-white"
            : "translate-x-7 bg-amber-500 text-white"
        )}
      >
        {isDark ? (
          <Moon className="h-3.5 w-3.5" />
        ) : (
          <Sun className="h-3.5 w-3.5" />
        )}
      </div>
    </button>
  );
}