"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Link2, FileText, BookOpen, X } from "lucide-react";
import { notesService, linkService, notebookService } from "@/lib/services";
import { cn } from "@/lib/utils";

type Item = {
  type: "note" | "link" | "notebook";
  id: string;
  title: string;
  sub?: string;
  href: string;
};

const ICONS = { note: FileText, link: Link2, notebook: BookOpen };
const TYPE_COLORS = {
  note: "var(--accent-note)",
  link: "var(--accent-link)",
  notebook: "var(--accent-notebook)",
};

export function SearchDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setItems([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      const query = q.trim().toLowerCase();
      if (!query) {
        setItems([]);
        return;
      }
      setLoading(true);
      const [notes, links, notebooks] = await Promise.all([
        notesService.getNotes().catch(() => []),
        linkService.getLinks().catch(() => []),
        notebookService.getNotebooks().catch(() => []),
      ]);
      const all: Item[] = [
        ...notes.map((n) => ({
          type: "note" as const,
          id: n.id,
          title: n.title || "Untitled",
          href: `/notes/${n.id}`,
        })),
        ...links.map((l) => ({
          type: "link" as const,
          id: l.id,
          title: l.title || l.url,
          sub: l.url,
          href: "/links",
        })),
        ...notebooks.map((nb) => ({
          type: "notebook" as const,
          id: nb.id,
          title: nb.name,
          href: `/notebooks/${nb.id}`,
        })),
      ];
      setItems(
        all
          .filter(
            (i) =>
              i.title.toLowerCase().includes(query) ||
              (i.sub ?? "").toLowerCase().includes(query),
          )
          .slice(0, 8),
      );
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [q, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-16 backdrop-blur-sm sm:pt-24"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search notes, links, notebooks…"
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Clear search"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <kbd className="hidden shrink-0 items-center gap-1 rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:flex">
            esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-2 app-scrollbar">
          {/* Empty state — no query */}
          {q.trim() === "" && (
            <div className="px-3 py-12 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Type to search across your stash.
              </p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                Notes · Links · Notebooks
              </p>
            </div>
          )}

          {/* Loading */}
          {loading && q.trim() !== "" && (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              Searching…
            </div>
          )}

          {/* No results */}
          {!loading && q.trim() !== "" && items.length === 0 && (
            <div className="px-3 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No results for{" "}
                <span className="font-medium text-foreground">
                  &ldquo;{q}&rdquo;
                </span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                Try a different search term
              </p>
            </div>
          )}

          {/* Results list */}
          {!loading &&
            items.map((item) => {
              const Icon = ICONS[item.type];
              const color = TYPE_COLORS[item.type];
              return (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => {
                    router.push(item.href);
                    onClose();
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
                      color,
                    }}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {item.title}
                    </span>
                    {item.sub && (
                      <span className="block truncate text-xs text-muted-foreground">
                        {item.sub}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                    {item.type}
                  </span>
                </button>
              );
            })}
        </div>

        {/* Footer hint */}
        <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[11px] text-muted-foreground/60">
          <span>{items.length > 0 ? `${items.length} results` : "Ready"}</span>
          <span className="hidden sm:block">↵ to open · esc to close</span>
        </div>
      </div>
    </div>
  );
}