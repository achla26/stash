"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Link2, FileText, BookOpen } from "lucide-react";
import { notesService, linkService, notebookService } from "@/lib/services";

type Item = {
  type: "note" | "link" | "notebook";
  id: string;
  title: string;
  sub?: string;
  href: string;
};

const ICONS = { note: FileText, link: Link2, notebook: BookOpen };

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
              (i.sub ?? "").toLowerCase().includes(query)
          )
          .slice(0, 8)
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
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-24"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search notes, links, notebooks..."
            className="w-full bg-transparent py-3.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="max-h-80 overflow-auto p-2">
          {q.trim() === "" && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Type to search across your stash.
            </p>
          )}
          {q.trim() !== "" && !loading && items.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No results for “{q}”.
            </p>
          )}
          {items.map((item) => {
            const Icon = ICONS[item.type];
            return (
              <button
                key={`${item.type}-${item.id}`}
                onClick={() => {
                  router.push(item.href);
                  onClose();
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent"
              >
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-foreground">
                    {item.title}
                  </span>
                  {item.sub && (
                    <span className="block truncate text-xs text-muted-foreground">
                      {item.sub}
                    </span>
                  )}
                </span>
                <span className="text-xs capitalize text-muted-foreground">
                  {item.type}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
