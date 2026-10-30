"use client";
import { Card } from "@/components/ui/card";
import { ItemIcon } from "@/components/shared/item-icon";

import { useState } from "react";
import { DetailSkeleton } from "@/components/shared/skeletons/page-skeleton";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  FileText,
  Folder,
  Loader2,
  Trash2,
  Pencil,
  MoreHorizontal,
  X,
  Check,
  ChevronDown,
  ChevronRight,
  BookOpen,
  FolderOpen,
  PanelLeft,
} from "lucide-react";
import * as React from "react";

import { useNotebook, useDeleteNotebook } from "@/hooks/use-notebooks";
import { useCreateFolder } from "@/hooks/use-folder";
import { FolderMenu } from "@/components/folders/folder-menu";
import { EditNotebookDialog } from "./edit-notebook-dialog";
import { useCreateNote, useNotes } from "@/hooks/use-notes";
import { Button } from "@/components/ui/button";
import { MarkdownPreview } from "@/components/notes/markdown-preview";
import type { Folder as FolderType, Note } from "@repo/contracts/types";
import { timeAgo } from "@/utils";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

/* ---------- Tiny popover ---------- */

function Popover({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      ref={ref}
      className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[220px] overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-lg"
    >
      {children}
    </div>
  );
}

export function NotebookDetail() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const notebookId = params.id;
  const queryClient = useQueryClient();

  const { data: notebook, isLoading } = useNotebook(notebookId);
  const createFolder = useCreateFolder();
  const createNote = useCreateNote();
  const { data: allNotes = [], isError: notesError } = useNotes();
  const deleteNotebook = useDeleteNotebook();

  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [selected, setSelected] = useState<{
    type: "root" | "folder" | "note";
    id: string;
  }>({ type: "root", id: "" });
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [treeOpen, setTreeOpen] = useState(true);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["notebook", notebookId] });
    queryClient.invalidateQueries({ queryKey: ["notebooks"] });
  };

  const currentFolderId =
    selected.type === "folder"
      ? selected.id
      : selected.type === "note"
        ? (allNotes.find((n) => n.id === selected.id)?.folderId ??
          notebook?.notes.find((n) => n.id === selected.id)?.folderId ??
          null)
        : null;

  const handleCreateFolder = () => {
    if (!folderName.trim()) return;
    createFolder.mutate(
      {
        name: folderName.trim(),
        type: "note",
        notebookId,
        parentId: currentFolderId,
        icon: "folder",
      },
      {
        onSuccess: () => {
          setFolderDialogOpen(false);
          setFolderName("");
          invalidate();
          if (currentFolderId)
            setExpanded((prev) => new Set(prev).add(currentFolderId));
          toast.success("Folder created");
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  };

  const handleCreateNote = () => {
    createNote.mutate(
      { title: "Untitled", notebookId, folderId: currentFolderId },
      {
        onSuccess: (note) => {
          invalidate();
          router.push(`/notes/${note.id}`);
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  };

  const handleDelete = () => {
    deleteNotebook.mutate(notebookId, {
      onSuccess: () => router.push("/notebooks"),
    });
  };

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (!notebook) {
    return (
      <div className="py-24 text-center text-sm text-muted-foreground">
        Notebook not found.
      </div>
    );
  }

  const folders = notebook.folders ?? [];
  const folderIds = new Set(folders.map((f) => f.id));
  const merged = new Map<string, Note>();
  for (const note of [...(notebook.notes ?? []), ...allNotes]) {
    if (
      note.notebookId === notebookId ||
      (note.folderId && folderIds.has(note.folderId))
    )
      merged.set(note.id, note);
  }
  const notes = [...merged.values()];
  const selectedNote =
    selected.type === "note"
      ? notes.find((n) => n.id === selected.id)
      : undefined;
  const selectedFolder =
    selected.type === "folder"
      ? folders.find((f) => f.id === selected.id)
      : undefined;
  const toggleFolder = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const folderTree = (
    parentId: string | null,
    depth: number,
    visited: Set<string>,
  ): React.ReactNode => {
    const children = folders.filter((f) =>
      parentId === null
        ? !f.parentId || !folderIds.has(f.parentId)
        : f.parentId === parentId,
    );
    const childNotes = notes.filter((n) =>
      parentId === null
        ? !n.folderId || !folderIds.has(n.folderId)
        : n.folderId === parentId,
    );
    return (
      <>
        {children.map((f: FolderType) => {
          if (visited.has(f.id)) return null;
          const open = expanded.has(f.id),
            next = new Set(visited).add(f.id);
          return (
            <div key={f.id}>
              <div
                className={cn(
                  "flex min-h-9 w-full min-w-0 items-center gap-1 px-2.5 py-1.5 text-left text-[13px] text-muted-foreground hover:bg-accent",
                  selected.type === "folder" &&
                    selected.id === f.id &&
                    "bg-primary/10 text-primary",
                )}
                style={{ paddingLeft: `${10 + depth * 16}px` }}
              >
                <button
                  type="button"
                  aria-label={`${open ? "Collapse" : "Expand"} ${f.name}`}
                  aria-expanded={open}
                  className="grid h-6 w-5 shrink-0 place-items-center"
                  onClick={() => toggleFolder(f.id)}
                >
                  {open ? (
                    <ChevronDown size={15} />
                  ) : (
                    <ChevronRight size={15} />
                  )}
                </button>
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-[7px] text-left"
                  onClick={() => {
                    setSelected({ type: "folder", id: f.id });
                    setExpanded((prev) => new Set(prev).add(f.id));
                  }}
                >
                  {open ? <FolderOpen size={16} /> : <Folder size={16} />}
                  <span className="truncate">{f.name}</span>
                </button>
                <FolderMenu
                  folderId={f.id}
                  folderName={f.name}
                  onDeleted={() => {
                    setSelected({ type: "root", id: "" });
                    invalidate();
                  }}
                />
              </div>
              {open && folderTree(f.id, depth + 1, next)}
            </div>
          );
        })}
        {childNotes.map((n) => (
          <button
            type="button"
            key={n.id}
            className={cn(
              "flex min-h-9 w-full min-w-0 items-center gap-1.5 px-2.5 py-1.5 text-left text-[13px] text-muted-foreground hover:bg-accent",
              selected.type === "note" &&
                selected.id === n.id &&
                "bg-primary/10 text-primary",
            )}
            style={{ paddingLeft: `${32 + depth * 16}px` }}
            onClick={() => setSelected({ type: "note", id: n.id })}
          >
            <FileText size={15} />
            <span className="truncate">{n.title || "Untitled"}</span>
          </button>
        ))}
      </>
    );
  };
  const coverColor = notebook.coverColor || "var(--primary)";

  return (
    <div className="mx-auto min-w-0 max-w-[1080px]">
      <Button
        variant="outline"
        className="mb-4"
        onClick={() => router.push("/notebooks")}
      >
        <ArrowLeft size={16} /> All notebooks
      </Button>
      {/* ---------- Header ---------- */}
      <Card className="mb-5 flex items-start justify-between gap-4 p-[18px]">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/notebooks")}
            className="hidden"
            aria-label="Back to notebooks"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
            style={{
              backgroundColor: `color-mix(in srgb, ${coverColor} 15%, transparent)`,
            }}
          >
            <ItemIcon value={notebook.icon} fallback="book" size={22} />
          </span>

          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold tracking-tight text-foreground">
              {notebook.name}
            </h1>
            {notebook.description && (
              <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                {notebook.description}
              </p>
            )}
          </div>
        </div>

        {/* Overflow menu */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              menuOpen && "bg-accent text-foreground",
            )}
            aria-label="More options"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          <Popover
            open={menuOpen}
            onClose={() => {
              setMenuOpen(false);
              setConfirmingDelete(false);
            }}
          >
            {!confirmingDelete ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setEditOpen(true);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent"
                >
                  <Pencil className="h-4 w-4 shrink-0 opacity-70" />
                  <span className="flex-1">Edit notebook</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 shrink-0 opacity-80" />
                  <span className="flex-1">Delete notebook</span>
                </button>
              </>
            ) : (
              <div className="p-1.5">
                <p className="mb-2 px-1 text-xs text-muted-foreground">
                  Delete this notebook? This can't be undone.
                </p>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    className="flex-1 rounded-lg border border-border px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleteNotebook.isPending}
                    className="flex-1 rounded-lg bg-destructive px-2 py-1.5 text-xs font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
                  >
                    {deleteNotebook.isPending ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            )}
          </Popover>
        </div>
      </Card>

      <div className="flex min-h-[560px] flex-col overflow-hidden rounded-xl border border-border bg-card md:flex-row">
        <aside
          className={cn(
            "min-w-0 border-b border-border bg-background-secondary md:w-[250px] md:flex-[0_0_250px] md:border-b-0 md:border-r",
            !treeOpen && "hidden",
          )}
          aria-label="Notebook explorer"
        >
          <div className="flex items-center justify-between px-3 py-2.5 text-[10px] font-extrabold tracking-[.1em] text-muted-foreground">
            <span>EXPLORER</span>
            <div className="flex gap-0.5">
              <button
                type="button"
                aria-label="New note"
                className="grid h-[30px] w-[30px] place-items-center rounded-[var(--radius-control)] hover:bg-accent"
                title="New note in selected folder"
                onClick={handleCreateNote}
                disabled={createNote.isPending}
              >
                <FileText size={16} />
              </button>
              <button
                type="button"
                aria-label="New folder"
                className="grid h-[30px] w-[30px] place-items-center rounded-[var(--radius-control)] hover:bg-accent"
                title="New folder in selected folder"
                onClick={() => setFolderDialogOpen(true)}
              >
                <Plus size={17} />
              </button>
            </div>
          </div>
          <button
            className={cn(
              "flex min-h-9 w-full min-w-0 items-center gap-1.5 px-2.5 py-1.5 text-left text-[13px] font-bold text-foreground hover:bg-accent",
              selected.type === "root" && "bg-primary/10 text-primary",
            )}
            onClick={() => setSelected({ type: "root", id: "" })}
          >
            <ChevronDown size={15} />
            <BookOpen size={16} />
            <span className="truncate">{notebook.name}</span>
          </button>
          <div className="max-h-[230px] overflow-y-auto md:max-h-[65vh]">
            {folderTree(null, 0, new Set())}
            {folders.length === 0 && notes.length === 0 && (
              <p className="px-[15px] py-2.5 text-xs leading-relaxed text-muted-foreground">
                No notes or folders yet. Use + to get started.
              </p>
            )}
          </div>
          {notesError && (
            <p
              role="alert"
              className="px-[15px] py-2.5 text-xs leading-relaxed text-destructive"
            >
              Some folder notes could not be loaded. Refresh to retry.
            </p>
          )}
        </aside>
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-w-0 flex-wrap items-center gap-2 border-b border-border px-3.5 py-2.5 md:flex-nowrap">
            <button
              className="grid h-[30px] w-[30px] place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
              onClick={() => setTreeOpen((v) => !v)}
              aria-label={treeOpen ? "Hide explorer" : "Show explorer"}
              aria-expanded={treeOpen}
            >
              <PanelLeft size={17} />
            </button>
            <span className="min-w-[80px] flex-1 truncate text-xs text-muted-foreground">
              {notebook.name}
              {selectedNote
                ? ` / ${selectedNote.title || "Untitled"}`
                : selectedFolder
                  ? ` / ${selectedFolder.name}`
                  : ""}
            </span>
            <Button variant="outline" onClick={() => setFolderDialogOpen(true)}>
              <Folder size={15} /> New folder
            </Button>
            <Button onClick={handleCreateNote} disabled={createNote.isPending}>
              <Plus size={15} />{" "}
              {createNote.isPending ? "Creating…" : "New note"}
            </Button>
          </div>
          {selectedNote ? (
            <article className="min-w-0 p-5 md:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
                <div className="min-w-0">
                  <span className="text-[10px] font-extrabold tracking-[.1em] text-primary">
                    NOTE PREVIEW
                  </span>
                  <h2 className="break-words text-[21px] font-extrabold">
                    {selectedNote.title || "Untitled"}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Updated {timeAgo(selectedNote.updatedAt)}
                  </p>
                </div>
                <Button asChild>
                  <Link href={`/notes/${selectedNote.id}`}>
                    <Pencil size={15} /> Open editor
                  </Link>
                </Button>
              </div>
              <div className="min-w-0 break-words pt-[22px]">
                {selectedNote.content ? (
                  <MarkdownPreview text={selectedNote.content} />
                ) : (
                  <p className="text-[13px] text-muted-foreground">
                    This note is empty. Open the editor to start writing.
                  </p>
                )}
              </div>
            </article>
          ) : (
            <div className="flex min-h-[390px] flex-1 flex-col items-center justify-center p-8 text-center">
              <span className="mb-[15px] grid h-[52px] w-[52px] place-items-center rounded-[14px] bg-primary/10 text-primary">
                {selectedFolder ? (
                  <FolderOpen size={25} />
                ) : (
                  <BookOpen size={25} />
                )}
              </span>
              <h2 className="break-words text-[21px] font-extrabold">
                {selectedFolder ? selectedFolder.name : notebook.name}
              </h2>
              <p className="mb-4 mt-2 max-w-[420px] text-[13px] leading-relaxed text-muted-foreground">
                {selectedFolder
                  ? "Select a note in the explorer, or create a new note inside this folder."
                  : notebook.description ||
                    "Your ideas, organised in one place. Select a note from the explorer to preview it."}
              </p>
              <div className="mb-5 flex gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-accent px-2.5 py-1">
                  {folders.length} folders
                </span>
                <span className="rounded-full bg-accent px-2.5 py-1">
                  {notes.length} notes
                </span>
              </div>
              <Button
                onClick={handleCreateNote}
                disabled={createNote.isPending}
              >
                <Plus size={15} />{" "}
                {createNote.isPending ? "Creating…" : "New note"}
              </Button>
            </div>
          )}
        </main>
      </div>

      {/* ---------- New Folder dialog — sheet-style ---------- */}
      {folderDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="New folder"
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              if (createFolder.isPending) return;
              setFolderDialogOpen(false);
              setFolderName("");
            }}
          />

          <div className="relative w-full max-w-md rounded-t-3xl border border-border bg-card p-6 shadow-2xl sm:rounded-3xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                New folder{currentFolderId ? " inside selected folder" : ""}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (createFolder.isPending) return;
                  setFolderDialogOpen(false);
                  setFolderName("");
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <input
              type="text"
              placeholder="Folder name…"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              autoFocus
              className="w-full border-none bg-transparent text-xl font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/40"
            />

            <div className="my-4 h-px w-full bg-border/70" />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  if (createFolder.isPending) return;
                  setFolderDialogOpen(false);
                  setFolderName("");
                }}
                disabled={createFolder.isPending}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateFolder}
                disabled={createFolder.isPending || !folderName.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
              >
                {createFolder.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Creating
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Create
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Edit dialog ---------- */}
      {editOpen && (
        <EditNotebookDialog
          notebook={notebook}
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  );
}
