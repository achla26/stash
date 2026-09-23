"use client";

import { useEffect, useState } from "react";
import {
  type Theme,
  getStoredTheme,
  applyTheme,
  getSystemTheme,
} from "@/lib/theme";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const stored = getStoredTheme();
    setTheme(stored);
    applyTheme(stored);
    setResolvedTheme(
      stored === "system" ? getSystemTheme() : stored
    );
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const handler = () => {
      if (theme === "system") {
        applyTheme("system");
        setResolvedTheme(getSystemTheme());
      }
    };

    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [theme]);

  const setThemeValue = (newTheme: Theme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    setResolvedTheme(
      newTheme === "system" ? getSystemTheme() : newTheme
    );
  };

  const toggleTheme = () => {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    setThemeValue(next);
  };

  return {
    theme,           // "light" | "dark" | "system"
    resolvedTheme,   // "light" | "dark"
    setTheme: setThemeValue,
    toggleTheme,
  };
}