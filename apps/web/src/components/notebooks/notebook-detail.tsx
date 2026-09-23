"use client";

import { useState } from "react";
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
} from "lucide-react";
import * as React from "react";

import { useNotebook, useDeleteNotebook } from "@/hooks/use-notebooks";
import { useCreateFolder } from "@/hooks/use-folder";
import { FolderMenu } from "@/components/folders/folder-menu";
import { EditNotebookDialog } from "./edit-notebook-dialog";
import { useCreateNote } from "@/hooks/use-notes";
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
  const deleteNotebook = useDeleteNotebook();

  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["notebook", notebookId] });
    queryClient.invalidateQueries({ queryKey: ["notebooks"] });
  };

  const handleCreateFolder = () => {
    if (!folderName.trim()) return;
    createFolder.mutate(
      { name: folderName.trim(), type: "note", notebookId, icon: "📁" },
      {
        onSuccess: () => {
          setFolderDialogOpen(false);
          setFolderName("");
          invalidate();
          toast.success("Folder created");
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  };

  const handleCreateNote = () => {
    createNote.mutate(
      { title: "Untitled", notebookId },
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
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!notebook) {
    return (
      <div className="py-24 text-center text-sm text-muted-foreground">
        Notebook not found.
      </div>
    );
  }

  const folders = notebook.folders ?? [];
  const notes = notebook.notes ?? [];
  const coverColor = notebook.coverColor || "var(--primary)";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      {/* ---------- Header ---------- */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/notebooks")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
            {notebook.icon}
          </span>

          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold tracking-tight text-foreground">
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
      </div>

      {/* ---------- Actions ---------- */}
      <div className="mb-8 flex gap-2">
        <button
          type="button"
          onClick={handleCreateNote}
          disabled={createNote.isPending}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        >
          {createNote.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          New Note
        </button>

        <button
          type="button"
          onClick={() => setFolderDialogOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Folder className="h-4 w-4" />
          New Folder
        </button>
      </div>

      {/* ---------- Folders ---------- */}
      <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Folders · {folders.length}
      </h2>
      {folders.length === 0 ? (
        <p className="mb-8 text-sm text-muted-foreground">
          No folders yet — folders inside a notebook work like sections.
        </p>
      ) : (
        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {folders.map((f) => {
            const folderColor = f.color || "var(--primary)";
            return (
              <div
                key={f.id}
                data-folder-card
                className="card-lift group relative flex items-center gap-2 rounded-xl border border-border bg-card p-4"
              >
                <Link
                  href={`/folders/${f.id}`}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-none"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${folderColor} 13%, transparent)`,
                      color: folderColor,
                    }}
                  >
                    <Folder className="h-4 w-4" />
                  </span>
                  <span className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                    {f.name}
                  </span>
                </Link>
                <FolderMenu folderId={f.id} folderName={f.name} />
              </div>
            );
          })}
        </div>
      )}

      {/* ---------- Notes ---------- */}
      <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Notes · {notes.length}
      </h2>
      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No notes in this notebook yet.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {notes.map((n) => (
            <Link
              key={n.id}
              href={`/notes/${n.id}`}
              className="card-lift flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left focus-visible:outline-none"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground">
                  {n.title}
                </span>
                <span className="block text-xs text-muted-foreground">
                  Updated {timeAgo(n.updatedAt)}
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}

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
                New folder
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