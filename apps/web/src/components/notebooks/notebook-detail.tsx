"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  FileText,
  Folder,
  Loader2,
  Trash2,
} from "lucide-react";

import { useNotebook, useDeleteNotebook } from "@/hooks/use-notebooks";
import { useCreateFolder } from "@/hooks/use-folder";
import { useCreateNote } from "@/hooks/use-notes";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { timeAgo } from "@/utils";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

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
  const [folderName, setFolderName] = useState("");

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
      }
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
      }
    );
  };

  const handleDelete = () => {
    if (!window.confirm("Delete this notebook?")) return;
    deleteNotebook.mutate(notebookId, {
      onSuccess: () => router.push("/notebooks"),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/notebooks")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span
            className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
            style={{ backgroundColor: `${notebook.coverColor}22` }}
          >
            {notebook.icon}
          </span>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {notebook.name}
            </h1>
            {notebook.description && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {notebook.description}
              </p>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={handleDelete}>
          <Trash2 className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      {/* Actions */}
      <div className="mb-8 flex gap-2">
        <Button
          onClick={handleCreateNote}
          disabled={createNote.isPending}
          className="gap-2"
        >
          {createNote.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          New Note
        </Button>
        <Button
          variant="outline"
          onClick={() => setFolderDialogOpen(true)}
          className="gap-2"
        >
          <Folder className="h-4 w-4" />
          New Folder
        </Button>
      </div>

      {/* Folders (= old sections) */}
      <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Folders · {folders.length}
      </h2>
      {folders.length === 0 ? (
        <p className="mb-8 text-sm text-muted-foreground">
          No folders yet — folders inside a notebook work like sections.
        </p>
      ) : (
        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {folders.map((f) => (
            <button
              key={f.id}
              onClick={() => router.push(`/folders/${f.id}`)}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary hover:shadow-md"
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${f.color ?? "#6366f1"}22`, color: f.color ?? "#6366f1" }}
              >
                <Folder className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold text-foreground">
                {f.name}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Notes (= old pages) */}
      <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Notes · {notes.length}
      </h2>
      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No notes in this notebook yet.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {notes.map((n) => (
            <button
              key={n.id}
              onClick={() => router.push(`/notes/${n.id}`)}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary hover:shadow-md"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="h-4 w-4" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-foreground">
                  {n.title}
                </span>
                <span className="block text-xs text-muted-foreground">
                  Updated {timeAgo(n.updatedAt)}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      {/* New Folder dialog */}
      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New Folder</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Folder name…"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setFolderDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} disabled={createFolder.isPending}>
              {createFolder.isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
