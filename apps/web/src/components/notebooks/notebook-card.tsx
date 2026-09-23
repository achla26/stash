"use client";

import { BookOpen, FileText, Layers, Trash2, Pin, PinOff } from "lucide-react";
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
  return (
    <div
      onClick={onOpen}
      className={cn(
        "group relative cursor-pointer rounded-xl border border-border bg-card p-5 transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-primary hover:shadow-md",
        (isDeleting || isPinning) && "pointer-events-none opacity-50"
      )}
    >
      {/* Pin Badge */}
      {notebook.isPinned && (
        <div className="absolute right-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
          <Pin className="h-3 w-3" />
        </div>
      )}

      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${notebook.coverColor}20` }}
        >
          <span className="text-xl">{notebook.icon}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPin();
            }}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            title={notebook.isPinned ? "Unpin" : "Pin"}
          >
            {notebook.isPinned ? (
              <PinOff className="h-3.5 w-3.5" />
            ) : (
              <Pin className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-foreground">{notebook.name}</h3>

      {/* Description */}
      {notebook.description && (
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {notebook.description}
        </p>
      )}

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
      <div
        className="mt-4 flex items-center justify-between border-t border-border pt-3"
      >
        <span className="text-xs text-muted-foreground">
          {timeAgo(notebook.updatedAt)}
        </span>
        <div
          className="rounded px-2 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: `${notebook.coverColor}15`,
            color: notebook.coverColor,
          }}
        >
          <BookOpen className="mr-1 inline h-3 w-3" />
          Notebook
        </div>
      </div>
    </div>
  );
}