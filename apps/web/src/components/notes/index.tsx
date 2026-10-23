"use client";

import { useMemo, useState } from "react";
import { NotesPageSkeleton } from "@/components/shared/skeletons/page-skeleton";
import {
  Folder,
  Calendar,
  Trash2,
  FileText,
  NotebookPen,
  Check,
  X,
  SearchX,
  Tag as TagIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useCreateNote, useDeleteNote, useNotes } from "@/hooks/use-notes";
import { useTypeFolders } from "@/hooks/use-folder";
import { useNotebooks } from "@/hooks/use-notebooks";
import { cn } from "@/lib/utils";
import { PageHeader } from "../shared/page-header";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { bulkService, notesAI } from "@/lib/services";
import { BulkBar } from "@/components/shared/bulk-bar";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  const router = useRouter();
  const [activeFolder, setActiveFolder] = useState<string>("All Notes");
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const { data: notes = [], isLoading, isError, error } = useNotes();
  const queryClient = useQueryClient();
  const [organizing, setOrganizing] = useState(false);
  const [visible, setVisible] = useState(12);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const uncategorizedCount = notes.filter(
    (n) =>
      !(n.tags ?? []).length &&
      JSON.stringify(n.content ?? "").length >= 60
  ).length;

  const handleOrganize = async () => {
    setOrganizing(true);
    try {
      const res = await notesAI.organize();
      const r = (res as {
        data?: { updated: number; skipped: number; tagged: string[]; left: number };
      })?.data;
      const tagged = (r as { tagged?: string[] })?.tagged ?? [];
      if (r?.updated) {
        toast.success(
          `Tagged: ${tagged.slice(0, 3).join(", ")}${
            tagged.length > 3 ? ` +${tagged.length - 3} more` : ""
          }${r?.left ? ` · ${r.left} left — click again` : ""}`
        );
      } else {
        const reasons =
          (r as { reasons?: Record<string, number> })?.reasons ?? {};
        const msg = reasons["no-key"]
          ? "Add GROQ_API_KEY in API env vars (Vercel → Environment Variables)"
          : reasons["ai-error"]
          ? "AI tagging failed — Groq request error (check key/quota)"
          : reasons["ai-empty"]
          ? "AI replied without usable tags — try again"
          : reasons["quota"]
          ? "Daily limit (30 AI tags) reached — try again tomorrow"
          : reasons["too-small"]
          ? "These notes are too short to tag (min 40 characters)"
          : reasons["cooldown"]
          ? "Wait a minute, then try again"
          : "AI found no new tags for these notes";
        toast.info(msg);
      }
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    } catch (e) {
      toast.error((e as Error).message || "Organize failed");
    }
    setOrganizing(false);
  };
  const { data: folders = [] } = useTypeFolders("note");
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

      const matchesTag = !activeTag || (note.tags ?? []).includes(activeTag);

      return matchesFolder && matchesSearch && matchesTag;
    });
  }, [notes, activeFolder, searchQuery, folders, notebooks, activeTag]);

  const tagRail = useMemo(() => {
    const counts = new Map<string, number>();
    for (const n of notes) for (const t of n.tags ?? []) counts.set(t, (counts.get(t) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [notes]);

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => bulkService.notesToTrash(ids),
    onSuccess: (_r, ids) => {
      toast.success(`${ids.length} note${ids.length > 1 ? "s" : ""} moved to trash`);
      setSelectMode(false);
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
    onError: () => toast.error("Bulk delete failed"),
  });

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleCreateNote = () => {
    createNoteMutation.mutate(
      {
        title: "",
        content: null,
        folderId: null,
      },
      {
        // open the editor straight away instead of just showing the card
        onSuccess: (note) => router.push(`/notes/${note.id}`),
        onError: (err) =>
          toast.error(
            `Couldn't create note — ${
              (err as { message?: string })?.message ?? "please try again"
            }`
          ),
      },
    );
  };

  const handleDeleteNote = (id: string) => {
    setPendingDeleteId(null);
    deleteNoteMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <NotesPageSkeleton />
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
      <PageHeader
        title="Notes"
        description="Your ideas, summaries and markdown — all in one place."
        actionLabel="New Note"
        onAction={handleCreateNote}
        isActionPending={createNoteMutation.isPending}
      />

      {/* AI organize */}
      {uncategorizedCount > 0 && (
        <button
          type="button"
          onClick={handleOrganize}
          disabled={organizing}
          className="inline-flex items-center gap-2 self-start rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/15 disabled:opacity-50"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {organizing
            ? "Organizing…"
            : `Organize my stash (${uncategorizedCount} untagged)`}
        </button>
      )}

      {/* Search */}
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search notes..."
      />

      {/* Bulk select */}
      {notes.length > 0 && !selectMode && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setSelectMode(true)}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            Select
          </button>
        </div>
      )}
      {selectMode && (
        <BulkBar
          selected={selectedIds.length}
          isDeleting={bulkDeleteMutation.isPending}
          onDelete={() => bulkDeleteMutation.mutate(selectedIds)}
          onCancel={() => {
            setSelectMode(false);
            setSelectedIds([]);
          }}
        />
      )}

      {/* Tag rail */}
      {tagRail.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tagRail.map(([t, n]) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setActiveTag(activeTag === t ? null : t);
                setVisible(12);
              }}
              className={
                activeTag === t
                  ? "inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white"
                  : "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              }
            >
              <TagIcon className="h-3 w-3" />
              {t}
              <span className="opacity-60">{n}</span>
            </button>
          ))}
        </div>
      )}

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

      {activeTag && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTag(null)}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
          >
            <TagIcon className="h-3 w-3" />
            {activeTag}
            <X className="h-3 w-3" />
          </button>
          <span className="text-xs text-muted-foreground">
            filter by tag — tap to clear
          </span>
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
            actionLabel={hasAnyNotes ? "New Note" : "Write Your First Note"}
            onAction={handleCreateNote}
            hint={
              hasAnyNotes
                ? undefined
                : "Markdown supported — headings, lists, code and more."
            }
          />
        )
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.slice(0, visible).map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              placement={placementFor(note)}
              onTagClick={(t) => {
                setActiveTag(t);
                setVisible(12);
              }}
              selectMode={selectMode}
              isSelected={selectedIds.includes(note.id)}
              onToggleSelect={() => toggleSelect(note.id)}
              isConfirmingDelete={pendingDeleteId === note.id}
              onRequestDelete={() => setPendingDeleteId(note.id)}
              onCancelDelete={() => setPendingDeleteId(null)}
              onConfirmDelete={() => handleDeleteNote(note.id)}
              isDeleting={
                deleteNoteMutation.isPending && pendingDeleteId === note.id
              }
            />
          ))}
        </div>
      )}

      {filteredNotes.length > visible && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setVisible((v) => v + 12)}
            className="rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            Show more ({visible} of {filteredNotes.length})
          </button>
        </div>
      )}
    </div>
  );
}

/* ===== Sub Components ===== */

interface NoteCardProps {
  note: Note;
  placement: Placement;
  onTagClick: (tag: string) => void;
  isConfirmingDelete: boolean;
  selectMode: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  onRequestDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  isDeleting: boolean;
}

function NoteCard({
  note,
  placement,
  onTagClick,
  isConfirmingDelete,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
  isDeleting,
  selectMode,
  isSelected,
  onToggleSelect,
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
      onClick={
        selectMode
          ? (e) => {
              e.preventDefault();
              onToggleSelect();
            }
          : undefined
      }
      className={cn(
        "note-card group relative flex flex-col gap-3 p-4",
        "focus-within:ring-2 focus-within:ring-ring/40",
        selectMode && "cursor-pointer",
        isSelected && "ring-2 ring-primary",
      )}
    >
      {/* Top row: icon tile + actions */}
      <div className="flex items-start justify-between gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{
            backgroundColor: `color-mix(in srgb, ${accent} 15%, transparent)`,
          }}
        >
          <FileText className="h-5 w-5" style={{ color: accent }} />
        </div>

      {selectMode && (
        <span
          className={
            isSelected
              ? "absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white"
              : "absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-card"
          }
        >
          {isSelected && <Check className="h-3 w-3" />}
        </span>
      )}

        {/* Actions — always visible on mobile, hover/focus on desktop */}
        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
          {isConfirmingDelete ? (
            <>
              <button
                type="button"
                onClick={onCancelDelete}
                aria-label="Cancel delete"
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onConfirmDelete}
                disabled={isDeleting}
                aria-label="Confirm delete"
                className="rounded-md bg-destructive/10 p-1.5 text-destructive transition-colors hover:bg-destructive/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onRequestDelete}
              aria-label="Delete note"
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
        <p className="line-clamp-2 text-sm text-muted-foreground">{preview}</p>
      </Link>

      {/* Tags */}
      {(note.tags ?? []).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {(note.tags ?? []).slice(0, 3).map((t) => (
            <button
              key={t}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onTagClick(t);
              }}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary/20"
            >
              <TagIcon className="h-3 w-3" />
              {t}
            </button>
          ))}
          {(note.tags ?? []).length > 3 && (
            <span className="text-[11px] text-muted-foreground">
              +{(note.tags ?? []).length - 3}
            </span>
          )}
        </div>
      )}

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