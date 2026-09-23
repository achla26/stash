"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Folder,
  Calendar,
  Trash2,
  FileText,
  NotebookPen,
  Check,
  X,
  SearchX,
} from "lucide-react";
import Link from "next/link";

import { useCreateNote, useDeleteNote, useNotes } from "@/hooks/use-notes";
import { useFolders } from "@/hooks/use-folder";
import { useNotebooks } from "@/hooks/use-notebooks";
import { cn } from "@/lib/utils";
import { SearchBar } from "../shared/search-bar";
import { FilterChip } from "../shared/filter-chips";
import { EmptyState } from "../shared/empty-state";
import type { Note } from "@repo/contracts/types";

/* ===== Helpers ===== */

function getPreview(content: string | null | undefined): string {
  if (!content) return "No content yet";
  return content;
}

type Placement = {
  kind: "folder" | "notebook" | "none";
  name: string;
};

/* ===== Main Component ===== */

export function NotesContent() {
  const [activeFolder, setActiveFolder] = useState<string>("All Notes");
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const { data: notes = [], isLoading, isError, error } = useNotes();
  const { data: folders = [] } = useFolders();
  const { data: notebooks = [] } = useNotebooks();
  const createNoteMutation = useCreateNote();
  const deleteNoteMutation = useDeleteNote();

  /* Folder chips: All + each real folder + Uncategorized */
  const folderFilters = useMemo(
    () => ["All Notes", ...folders.map((f) => f.name), "Uncategorized"],
    [folders],
  );

  const placementFor = (note: Note): Placement => {
    if (note.folderId) {
      const folder = folders.find((f) => f.id === note.folderId);
      return { kind: "folder", name: folder?.name ?? "Folder" };
    }
    if (note.notebookId) {
      const notebook = notebooks.find((n) => n.id === note.notebookId);
      return { kind: "notebook", name: notebook?.name ?? "Notebook" };
    }
    return { kind: "none", name: "Uncategorized" };
  };

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const preview = getPreview(note.content);
      const placement = placementFor(note);

      const matchesFolder =
        activeFolder === "All Notes" ||
        (activeFolder === "Uncategorized"
          ? placement.kind === "none"
          : placement.kind === "folder" && placement.name === activeFolder);

      const matchesSearch =
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        preview.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesFolder && matchesSearch;
    });
  }, [notes, activeFolder, searchQuery, folders, notebooks]);

  const handleCreateNote = () => {
    createNoteMutation.mutate({
      title: "Untitled",
      content: null,
      folderId: null,
    });
  };

  const handleDeleteNote = (id: string) => {
    setPendingDeleteId(null);
    deleteNoteMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl py-12 text-center">
        <p className="text-muted-foreground">Loading notes...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-5xl py-12 text-center">
        <p className="text-destructive">
          {(error as Error)?.message ?? "Failed to load notes"}
        </p>
      </div>
    );
  }

  const hasAnyNotes = notes.length > 0;
  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Notes
        </h2>
        <button
          onClick={handleCreateNote}
          disabled={createNoteMutation.isPending}
          className="bg-primary inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {createNoteMutation.isPending ? "Creating..." : "New Note"}
        </button>
      </div>

      {/* Search */}
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search notes..."
      />

      {/* Folder chips — driven by real folders */}
      {folderFilters.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {folderFilters.map((folder) => (
            <FilterChip
              key={folder}
              label={folder}
              isActive={activeFolder === folder}
              onClick={() => setActiveFolder(folder)}
            />
          ))}
        </div>
      )}

      {/* Notes grid */}
      {filteredNotes.length === 0 ? (
        isSearching || activeFolder !== "All Notes" ? (
          <EmptyState
            icon={SearchX}
            title="No matching notes"
            description={
              isSearching
                ? `Nothing matches "${searchQuery}". Try a different search.`
                : `No notes in "${activeFolder}" yet.`
            }
            actionLabel="Clear filters"
            onAction={() => {
              setSearchQuery("");
              setActiveFolder("All Notes");
            }}
          />
        ) : (
          <EmptyState
            icon={FileText}
            title={hasAnyNotes ? "No notes here" : "No notes yet"}
            description="Create your first note to get started."
            actionLabel="New Note"
            onAction={handleCreateNote}
          />
        )
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              placement={placementFor(note)}
              isConfirmingDelete={pendingDeleteId === note.id}
              onRequestDelete={() => setPendingDeleteId(note.id)}
              onCancelDelete={() => setPendingDeleteId(null)}
              onConfirmDelete={() => handleDeleteNote(note.id)}
              isDeleting={
                deleteNoteMutation.isPending &&
                pendingDeleteId === note.id
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ===== Sub Components ===== */

interface NoteCardProps {
  note: Note;
  placement: Placement;
  isConfirmingDelete: boolean;
  onRequestDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  isDeleting: boolean;
}

function NoteCard({
  note,
  placement,
  isConfirmingDelete,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
  isDeleting,
}: NoteCardProps) {
  const preview = getPreview(note.content);

  const accent =
    placement.kind === "notebook"
      ? "var(--accent-notebook)"
      : placement.kind === "folder"
        ? "var(--accent-note)"
        : "var(--muted-foreground)";

  const PlacementIcon = placement.kind === "notebook" ? NotebookPen : Folder;

  return (
    <div
      className={cn(
        "note-card group relative flex flex-col gap-3 p-4",
        "focus-within:ring-2 focus-within:ring-ring/40",
      )}
    >
      {/* Top row: icon tile + actions */}
      <div className="flex items-start justify-between gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `color-mix(in srgb, ${accent} 15%, transparent)` }}
        >
          <FileText className="h-5 w-5" style={{ color: accent }} />
        </div>

        {/* Actions — always visible on mobile, hover/focus on desktop */}
        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
          {isConfirmingDelete ? (
            <>
              <button
                type="button"
                onClick={onCancelDelete}
                aria-label="Cancel delete"
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent"
              >
                <X className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onConfirmDelete}
                disabled={isDeleting}
                aria-label="Confirm delete"
                className="rounded-md bg-destructive/10 p-1.5 text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onRequestDelete}
              aria-label="Delete note"
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Body — clickable link */}
      <Link
        href={`/notes/${note.id}`}
        className="flex flex-1 flex-col gap-1.5 focus:outline-none"
      >
        <h3 className="line-clamp-1 font-semibold text-foreground transition-colors group-hover:text-primary">
          {note.title || "Untitled"}
        </h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {preview}
        </p>
      </Link>

      {/* Footer */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="h-3 w-3" />
          {new Date(note.updatedAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </span>
        {placement.kind !== "none" && (
          <span
            className="inline-flex items-center gap-1.5 font-medium"
            style={{ color: accent }}
          >
            <PlacementIcon className="h-3 w-3" />
            <span className="line-clamp-1 max-w-[10rem]">
              {placement.name}
            </span>
          </span>
        )}
        {placement.kind === "none" && (
          <span className="inline-flex items-center gap-1.5 opacity-70">
            <Folder className="h-3 w-3" />
            Uncategorized
          </span>
        )}
      </div>
    </div>
  );
}