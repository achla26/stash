"use client";

import Link from "next/link";
import {
  BookOpen,
  FileText,
  Layers,
  Trash2,
  Pin,
  PinOff,
  Check,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/utils";
import type { NotebookWithCounts } from "@repo/contracts/types";

interface NotebookCardProps {
  notebook: NotebookWithCounts;
  onOpen: () => void;
  onDelete: () => void;
  onPin: () => void;
  isDeleting?: boolean;
  isPinning?: boolean;
}

export function NotebookCard({
  notebook,
  onOpen,
  onDelete,
  onPin,
  isDeleting = false,
  isPinning = false,
}: NotebookCardProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const coverColor = notebook.coverColor || "var(--primary)";
  const busy = isDeleting || isPinning;

  const handleConfirmDelete = () => {
    setConfirmingDelete(false);
    onDelete();
  };

  return (
    <div
      className={cn(
        "group relative rounded-xl border border-border bg-card p-5 transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_6px_20px_var(--primary-glow)]",
        "focus-within:border-primary focus-within:shadow-[0_6px_20px_var(--primary-glow)]",
        busy && "pointer-events-none opacity-50",
      )}
    >
      {/* Pin badge */}
      {notebook.isPinned && (
        <div className="pointer-events-none absolute right-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
          <Pin className="h-3 w-3" />
        </div>
      )}

      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{
            backgroundColor: `color-mix(in srgb, ${coverColor} 13%, transparent)`,
          }}
        >
          <span className="text-xl">{notebook.icon}</span>
        </div>

        {/* Actions — visible on mobile, hover/focus on desktop */}
        <div className="flex items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
          {confirmingDelete ? (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setConfirmingDelete(false);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Cancel delete"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleConfirmDelete();
                }}
                disabled={isDeleting}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-destructive/10 text-destructive transition-colors hover:bg-destructive/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                aria-label="Confirm delete"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onPin();
                }}
                disabled={isPinning}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                aria-label={notebook.isPinned ? "Unpin" : "Pin"}
              >
                {notebook.isPinned ? (
                  <PinOff className="h-3.5 w-3.5" />
                ) : (
                  <Pin className="h-3.5 w-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setConfirmingDelete(true);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Body — real Link for nav */}
      <Link
        href={`/notebooks/${notebook.id}`}
        onClick={(e) => {
          // allow parent onOpen to also fire, or just use the Link
          if (onOpen) {
            // if you want to keep router.push, uncomment:
            // e.preventDefault(); onOpen();
          }
        }}
        className="block focus-visible:outline-none"
      >
        <h3 className="font-semibold text-foreground transition-colors group-hover:text-primary">
          {notebook.name}
        </h3>

        {notebook.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {notebook.description}
          </p>
        )}
      </Link>

      {/* Meta */}
      <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Layers className="h-3 w-3" />
          {notebook.foldersCount} folders
        </div>
        <div className="flex items-center gap-1">
          <FileText className="h-3 w-3" />
          {notebook.notesCount} notes
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <span className="text-xs text-muted-foreground">
          {timeAgo(notebook.updatedAt)}
        </span>
        <div
          className="rounded px-2 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: `color-mix(in srgb, ${coverColor} 13%, transparent)`,
            color: coverColor,
          }}
        >
          <BookOpen className="mr-1 inline h-3 w-3" />
          Notebook
        </div>
      </div>
    </div>
  );
}