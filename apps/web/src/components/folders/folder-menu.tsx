"use client";

import { useEffect, useRef, useState } from "react";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { useUpdateFolder, useDeleteFolder } from "@/hooks/use-folder";
import { toast } from "sonner";
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
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
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
      className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[200px] overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-lg"
    >
      {children}
    </div>
  );
}

export function FolderMenu({
  folderId,
  folderName,
  onDeleted,
}: {
  folderId: string;
  folderName: string;
  onDeleted?: () => void;
}) {
  const updateFolder = useUpdateFolder();
  const deleteFolder = useDeleteFolder();
  const queryClient = useQueryClient();

  const [menuOpen, setMenuOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [name, setName] = useState(folderName);

  useEffect(() => setName(folderName), [folderName]);

  const handleRename = () => {
    if (!name.trim()) return;
    updateFolder.mutate(
      { id: folderId, name: name.trim() },
      {
        onSuccess: () => {
          queryClient.invalidateQueries();
          setRenameOpen(false);
          toast.success("Folder renamed");
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  };

  const handleDelete = () => {
    deleteFolder.mutate(folderId, {
      onSuccess: () => {
        queryClient.invalidateQueries();
        toast.success("Folder deleted");
        onDeleted?.();
      },
      onError: (e) => toast.error((e as Error).message),
    });
  };

  return (
    <>
      <div className="relative" data-folder-menu>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setMenuOpen((v) => !v);
          }}
          aria-label="Folder options"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            menuOpen && "bg-accent text-foreground",
          )}
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
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setMenuOpen(false);
                  setRenameOpen(true);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent"
              >
                <Pencil className="h-4 w-4 shrink-0 opacity-70" />
                <span className="flex-1">Rename</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setConfirmingDelete(true);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 shrink-0 opacity-80" />
                <span className="flex-1">Delete</span>
              </button>
            </>
          ) : (
            <div className="p-1.5">
              <p className="mb-2 px-1 text-xs text-muted-foreground">
                Delete "{folderName}"? This can't be undone.
              </p>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setConfirmingDelete(false);
                  }}
                  className="flex-1 rounded-lg border border-border px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleDelete();
                  }}
                  disabled={deleteFolder.isPending}
                  className="flex-1 rounded-lg bg-destructive px-2 py-1.5 text-xs font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
                >
                  {deleteFolder.isPending ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          )}
        </Popover>
      </div>

      {/* ---------- Rename dialog — sheet-style ---------- */}
      {renameOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Rename folder"
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              if (updateFolder.isPending) return;
              setRenameOpen(false);
              setName(folderName);
            }}
          />

          <div className="relative w-full max-w-md rounded-t-3xl border border-border bg-card p-6 shadow-2xl sm:rounded-3xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Rename folder
              </span>
              <button
                type="button"
                onClick={() => {
                  if (updateFolder.isPending) return;
                  setRenameOpen(false);
                  setName(folderName);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
              autoFocus
              className="w-full border-none bg-transparent text-xl font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/40"
            />

            <div className="my-4 h-px w-full bg-border/70" />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  if (updateFolder.isPending) return;
                  setRenameOpen(false);
                  setName(folderName);
                }}
                disabled={updateFolder.isPending}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRename}
                disabled={updateFolder.isPending || !name.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
              >
                {updateFolder.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}