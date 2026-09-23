"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, FileText, Link2, BookOpen, FileCode } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuickAddButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click + Escape
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const actions = [
    {
      label: "New Note",
      icon: FileText,
      onClick: () => router.push("/notes"),
    },
    {
      label: "Save Link",
      icon: Link2,
      onClick: () => router.push("/links"),
    },
    {
      label: "New Notebook",
      icon: BookOpen,
      onClick: () => router.push("/notebooks"),
    },
    {
      label: "New Pad",
      icon: FileCode,
      onClick: () => router.push("/pad"),
    },
  ];

  return (
    <div ref={ref} className="fixed bottom-24 right-5 z-40 md:bottom-6 md:right-6">
      {/* Actions menu — opens above the button */}
      {open && (
        <div className="absolute bottom-[calc(100%+12px)] right-0 flex flex-col gap-2">
          {actions.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.label}
                type="button"
                onClick={() => {
                  setOpen(false);
                  a.onClick();
                }}
                className="flex items-center gap-2.5 rounded-full border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground shadow-lg transition-all hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                {a.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Main button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close quick add" : "Quick add"}
        aria-expanded={open}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_24px_var(--primary-glow)] transition-all duration-200",
          "hover:scale-105 hover:bg-primary-hover active:scale-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          open && "rotate-45",
        )}
      >
        <Plus className="h-6 w-6 transition-transform" />
      </button>
    </div>
  );
}