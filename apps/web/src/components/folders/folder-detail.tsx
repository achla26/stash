"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText, Folder, Link2, Loader2, Plus } from "lucide-react";

import { useFolders, useCreateFolder } from "@/hooks/use-folder";
import { useNotes, useCreateNote } from "@/hooks/use-notes";
import { useLinks } from "@/hooks/use-links";
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
      }
    );
  };

  const handleCreateNote = () => {
    createNote.mutate(
      { title: "Untitled", folderId },
      {
        onSuccess: (note) => router.push(`/notes/${note.id}`),
        onError: (e) => toast.error((e as Error).message),
      }
    );
  };

  if (fLoading || nLoading || lLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
      <div className="mb-8 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <span
          className="flex h-12 w-12 items-center justify-center rounded-xl"
          style={{
            backgroundColor: `${folder.color ?? "#6366f1"}22`,
            color: folder.color ?? "#6366f1",
          }}
        >
          <Folder className="h-5 w-5" />
        </span>
        <h1 className="text-2xl font-bold text-foreground">{folder.name}</h1>
      </div>

      <div className="mb-8 flex gap-2">
        <Button onClick={handleCreateNote} disabled={createNote.isPending} className="gap-2">
          {createNote.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          New Note
        </Button>
        <Button variant="outline" onClick={() => setSubDialogOpen(true)} className="gap-2">
          <Folder className="h-4 w-4" />
          New Subfolder
        </Button>
      </div>

      <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Subfolders · {subfolders.length}
      </h2>
      {subfolders.length === 0 ? (
        <p className="mb-8 text-sm text-muted-foreground">No subfolders.</p>
      ) : (
        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {subfolders.map((f) => (
            <button
              key={f.id}
              onClick={() => router.push(`/folders/${f.id}`)}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary hover:shadow-md"
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{
                  backgroundColor: `${f.color ?? "#6366f1"}22`,
                  color: f.color ?? "#6366f1",
                }}
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

      <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Notes · {folderNotes.length}
      </h2>
      {folderNotes.length === 0 ? (
        <p className="mb-8 text-sm text-muted-foreground">No notes in this folder.</p>
      ) : (
        <div className="mb-8 flex flex-col gap-2">
          {folderNotes.map((n) => (
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

      <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
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
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary hover:shadow-md"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-600">
                <Link2 className="h-4 w-4" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-foreground">
                  {l.title || l.url}
                </span>
                <span className="block text-xs text-muted-foreground">{l.url}</span>
              </span>
            </a>
          ))}
        </div>
      )}

      <Dialog open={subDialogOpen} onOpenChange={setSubDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New Subfolder</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Subfolder name…"
            value={subName}
            onChange={(e) => setSubName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateSub()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSub} disabled={createFolder.isPending}>
              {createFolder.isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
