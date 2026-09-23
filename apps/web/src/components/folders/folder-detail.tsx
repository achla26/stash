"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Folder,
  Link2,
  Loader2,
  Plus,
  Check,
  X,
} from "lucide-react";

import { useFolders, useCreateFolder } from "@/hooks/use-folder";
import { FolderMenu } from "@/components/folders/folder-menu";
import { useNotes, useCreateNote } from "@/hooks/use-notes";
import { useLinks } from "@/hooks/use-links";
import { timeAgo } from "@/utils";
import { toast } from "sonner";

export function FolderDetail() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const folderId = params.id;

  const { data: folders = [], isLoading: fLoading } = useFolders();
  const { data: notes = [], isLoading: nLoading } = useNotes();
  const { data: links = [], isLoading: lLoading } = useLinks();
  const createFolder = useCreateFolder();
  const createNote = useCreateNote();

  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [subName, setSubName] = useState("");

  const folder = folders.find((f) => f.id === folderId);
  const subfolders = folders.filter((f) => f.parentId === folderId);
  const folderNotes = notes.filter((n) => n.folderId === folderId);
  const folderLinks = links.filter((l) => l.folderId === folderId);

  const folderColor = folder?.color || "var(--primary)";

  const handleCreateSub = () => {
    if (!subName.trim()) return;
    createFolder.mutate(
      { name: subName.trim(), type: "note", parentId: folderId, icon: "📁" },
      {
        onSuccess: () => {
          setSubDialogOpen(false);
          setSubName("");
          toast.success("Subfolder created");
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  };

  const handleCreateNote = () => {
    createNote.mutate(
      { title: "Untitled", folderId },
      {
        onSuccess: (note) => router.push(`/notes/${note.id}`),
        onError: (e) => toast.error((e as Error).message),
      },
    );
  };

  if (fLoading || nLoading || lLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="py-24 text-center text-sm text-muted-foreground">
        Folder not found.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      {/* ---------- Header ---------- */}
      <div className="mb-8 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
          style={{
            backgroundColor: `color-mix(in srgb, ${folderColor} 15%, transparent)`,
            color: folderColor,
          }}
        >
          <Folder className="h-5 w-5" />
        </span>

        <h1 className="min-w-0 flex-1 truncate text-2xl font-bold tracking-tight text-foreground">
          {folder.name}
        </h1>

        <FolderMenu
          folderId={folder.id}
          folderName={folder.name}
          onDeleted={() =>
            router.push(
              folder.parentId
                ? `/folders/${folder.parentId}`
                : folder.notebookId
                  ? `/notebooks/${folder.notebookId}`
                  : "/dashboard",
            )
          }
        />
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
          onClick={() => setSubDialogOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Folder className="h-4 w-4" />
          New Subfolder
        </button>
      </div>

      {/* ---------- Subfolders ---------- */}
      <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Subfolders · {subfolders.length}
      </h2>
      {subfolders.length === 0 ? (
        <p className="mb-8 text-sm text-muted-foreground">No subfolders.</p>
      ) : (
        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {subfolders.map((f) => {
            const subColor = f.color || "var(--primary)";
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
                      backgroundColor: `color-mix(in srgb, ${subColor} 13%, transparent)`,
                      color: subColor,
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
        Notes · {folderNotes.length}
      </h2>
      {folderNotes.length === 0 ? (
        <p className="mb-8 text-sm text-muted-foreground">
          No notes in this folder.
        </p>
      ) : (
        <div className="mb-8 flex flex-col gap-2">
          {folderNotes.map((n) => (
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

      {/* ---------- Links ---------- */}
      <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Links · {folderLinks.length}
      </h2>
      {folderLinks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No links in this folder.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {folderLinks.map((l) => (
            <a
              key={l.id}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              className="card-lift flex items-center gap-3 rounded-xl border border-border bg-card p-4 focus-visible:outline-none"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-link/15 text-accent-link">
                <Link2 className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground">
                  {l.title || l.url}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {l.url}
                </span>
              </span>
            </a>
          ))}
        </div>
      )}

      {/* ---------- New Subfolder dialog — sheet-style ---------- */}
      {subDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="New subfolder"
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              if (createFolder.isPending) return;
              setSubDialogOpen(false);
              setSubName("");
            }}
          />

          <div className="relative w-full max-w-md rounded-t-3xl border border-border bg-card p-6 shadow-2xl sm:rounded-3xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                New subfolder
              </span>
              <button
                type="button"
                onClick={() => {
                  if (createFolder.isPending) return;
                  setSubDialogOpen(false);
                  setSubName("");
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <input
              type="text"
              placeholder="Subfolder name…"
              value={subName}
              onChange={(e) => setSubName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateSub()}
              autoFocus
              className="w-full border-none bg-transparent text-xl font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/40"
            />

            <div className="my-4 h-px w-full bg-border/70" />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  if (createFolder.isPending) return;
                  setSubDialogOpen(false);
                  setSubName("");
                }}
                disabled={createFolder.isPending}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateSub}
                disabled={createFolder.isPending || !subName.trim()}
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
    </div>
  );
}