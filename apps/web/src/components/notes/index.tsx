"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  MoreHorizontal,
  Folder,
  Calendar,
  Trash2,
  FileText,
} from "lucide-react";
import { useRouter } from "next/navigation";

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
  if (typeof content === "string") return content;
  return "No content yet";
}

/* ===== Static Data ===== */

const FOLDER_FILTERS = ["All Notes"];

/* ===== Main Component ===== */

export function NotesContent() {
  const router = useRouter();
  const [activeFolder, setActiveFolder] = useState("All Notes");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: notes = [], isLoading, isError, error } = useNotes();
  const { data: folders = [] } = useFolders();
  const { data: notebooks = [] } = useNotebooks();
  const createNoteMutation = useCreateNote();
  const deleteNoteMutation = useDeleteNote();

  // v2: note folder me ho ya notebook me — placement ka asli naam
  const placementLabel = (note: Note): string | null => {
    if (note.folderId) {
      return folders.find((f) => f.id === note.folderId)?.name ?? "Folder";
    }
    if (note.notebookId) {
      return notebooks.find((n) => n.id === note.notebookId)?.name ?? "Notebook";
    }
    return null;
  };

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const preview = getPreview(note.content);

      const matchesFolder =
        activeFolder === "All Notes" ||
        (!note.folderId && !note.notebookId
          ? activeFolder === "Uncategorized"
          : false);

      const matchesSearch =
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        preview.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesFolder && matchesSearch;
    });
  }, [notes, activeFolder, searchQuery]);

  const handleCreateNote = () => {
    createNoteMutation.mutate({
      title: "Untitled",
      content: null,
      folderId: null,
    });
  };

  const handleDeleteNote = (id: string) => {
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

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-foreground">Notes</h2>
        <button
          onClick={handleCreateNote}
          disabled={createNoteMutation.isPending}
          className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-medium text-white gradient-button disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {createNoteMutation.isPending ? "Creating..." : "New Note"}
        </button>
      </div>

      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search notes..."
      />

      {/* Folder Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {FOLDER_FILTERS.map((folder) => (
          <FilterChip
            key={folder}
            label={folder}
            isActive={activeFolder === folder}
            onClick={() => setActiveFolder(folder)}
          />
        ))}
      </div>

      {/* Notes List */}
      {filteredNotes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No notes found"
          description="Create your first note to get started."
          actionLabel="New Note"
          onAction={handleCreateNote}
        />
      ) : (
        <div className="space-y-3">
          {filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              placement={placementLabel(note)}
              onOpen={() => router.push(`/notes/${note.id}`)}
              onDelete={() => handleDeleteNote(note.id)}
              isDeleting={deleteNoteMutation.isPending}
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
  placement: string | null;
  onOpen: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

function NoteCard({ note, placement, onOpen, onDelete, isDeleting }: NoteCardProps) {
  const preview = getPreview(note.content);
  const isUncategorized = !placement;

  return (
    <div
      onClick={onOpen}
      className="glass card-hover group cursor-pointer rounded-xl border border-border p-4"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left Content */}
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <h3 className="font-semibold text-foreground">
              {note.title || "Untitled"}
            </h3>
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs",
                isUncategorized
                  ? "bg-muted/30 text-muted-foreground"
                  : "bg-primary/10 text-primary"
              )}
            >
              <Folder className="h-3 w-3" />
              {isUncategorized ? "Uncategorized" : placement}
            </span>
          </div>

          <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
            {preview}
          </p>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {new Date(note.updatedAt).toLocaleDateString()}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="rounded-lg p-2 text-muted-foreground opacity-0 transition-all hover:bg-accent group-hover:opacity-100"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            disabled={isDeleting}
            className="rounded-lg p-2 opacity-0 transition-all hover:bg-destructive/10 group-hover:opacity-100 disabled:opacity-50"
          >
            <Trash2 className="h-5 w-5 text-destructive" />
          </button>
        </div>
      </div>
    </div>
  );
}