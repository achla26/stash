"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Trash2,
  Check,
  Loader2,
  MoreHorizontal,
  Folder,
  FileText,
  BookOpen,
  CircleAlert,
  X,
} from "lucide-react";

import { useDeleteNote, useNote, useUpdateNote } from "@/hooks/use-notes";
import { useFolders } from "@/hooks/use-folder";
import { useNotebooks } from "@/hooks/use-notebooks";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

/* ============================================================
   Helpers
   ============================================================ */

function getTextContent(content: string | null | undefined): string {
  if (!content) return "";
  return content;
}

type SaveStatus = "saved" | "unsaved" | "saving";

type Placement =
  | { kind: "loose" }
  | { kind: "folder"; id: string; name: string }
  | { kind: "notebook"; id: string; name: string };

/* ============================================================
   Small building blocks
   ============================================================ */

/**
 * Popover — lightweight, no dep. Closes on outside click or Esc.
 */
function Popover({
  open,
  onClose,
  children,
  align = "end",
  className,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  align?: "start" | "end";
  className?: string;
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
      className={cn(
        "absolute top-[calc(100%+8px)] z-50 min-w-[240px] overflow-hidden rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg",
        align === "end" ? "right-0" : "left-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

function PopoverItem({
  icon: Icon,
  label,
  onClick,
  danger,
  active,
  sublabel,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  danger?: boolean;
  active?: boolean;
  sublabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
        danger
          ? "text-destructive hover:bg-destructive/10"
          : "text-foreground hover:bg-accent",
        active && "bg-accent",
      )}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0 opacity-70" />}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {sublabel && (
        <span className="text-xs text-muted-foreground">{sublabel}</span>
      )}
      {active && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
    </button>
  );
}

/**
 * Save status — fixed width so toolbar never jumps.
 */
function SaveStatusIndicator({ status }: { status: SaveStatus }) {
  return (
    <div className="flex h-6 w-[110px] items-center gap-1.5 text-xs">
      {status === "saving" && (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Saving…</span>
        </>
      )}
      {status === "saved" && (
        <>
          <Check className="h-3.5 w-3.5 text-success" />
          <span className="text-muted-foreground">Saved</span>
        </>
      )}
      {status === "unsaved" && (
        <>
          <CircleAlert className="h-3.5 w-3.5 text-warning" />
          <span className="text-warning">Unsaved</span>
        </>
      )}
    </div>
  );
}

/* ============================================================
   Main
   ============================================================ */

export function NoteEditor() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const noteId = params.id;

  const { data: note, isLoading, isError, error } = useNote(noteId);
  const updateNoteMutation = useUpdateNote();
  const deleteNoteMutation = useDeleteNote();
  const { data: folders = [] } = useFolders();
  const { data: notebooks = [] } = useNotebooks();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");

  // popover / menu state
  const [folderMenuOpen, setFolderMenuOpen] = useState(false);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const isFirstLoad = useRef(true);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  /* ---------- Load note once ---------- */
  useEffect(() => {
    if (note && isFirstLoad.current) {
      setTitle(note.title ?? "");
      setContent(getTextContent(note.content));
      isFirstLoad.current = false;
    }
  }, [note]);

  /* ---------- Auto-grow textarea ---------- */
  const resizeBody = useCallback(() => {
    const el = bodyRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    resizeBody();
  }, [content, resizeBody]);

  /* ---------- Dirty tracking ---------- */
  const debouncedTitle = useDebounce(title, 800);
  const debouncedContent = useDebounce(content, 800);

  const originalTitle = useMemo(() => note?.title ?? "", [note?.title]);
  const originalContent = useMemo(
    () => getTextContent(note?.content),
    [note?.content],
  );

  useEffect(() => {
    if (isFirstLoad.current) return;
    if (title !== originalTitle || content !== originalContent) {
      setSaveStatus("unsaved");
    }
  }, [title, content, originalTitle, originalContent]);

  /* ---------- Autosave ---------- */
  useEffect(() => {
    if (isFirstLoad.current) return;
    if (!noteId) return;

    const hasChanges =
      debouncedTitle !== originalTitle ||
      debouncedContent !== originalContent;
    if (!hasChanges) return;

    setSaveStatus("saving");
    updateNoteMutation.mutate(
      {
        id: noteId,
        title: debouncedTitle.trim() || "Untitled",
        content: debouncedContent,
      },
      {
        onSuccess: () => setSaveStatus("saved"),
        onError: () => setSaveStatus("unsaved"),
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTitle, debouncedContent]);

  /* ---------- Placement ---------- */
  const placement: Placement = useMemo(() => {
    if (note?.notebookId) {
      const nb = notebooks.find((n) => n.id === note.notebookId);
      return {
        kind: "notebook",
        id: note.notebookId,
        name: nb?.name ?? "Notebook",
      };
    }
    if (note?.folderId) {
      const f = folders.find((x) => x.id === note.folderId);
      return {
        kind: "folder",
        id: note.folderId,
        name: f?.name ?? "Folder",
      };
    }
    return { kind: "loose" };
  }, [note?.folderId, note?.notebookId, folders, notebooks]);

  const handleMove = (next: Placement) => {
    if (!noteId) return;
    updateNoteMutation.mutate({
      id: noteId,
      folderId: next.kind === "folder" ? next.id : null,
      notebookId: next.kind === "notebook" ? next.id : null,
    });
    setFolderMenuOpen(false);
  };

  /* ---------- Delete ---------- */
  const handleDelete = () => {
    if (!noteId) return;
    deleteNoteMutation.mutate(noteId, {
      onSuccess: () => router.push("/notes"),
    });
  };

  /* ---------- Early states ---------- */
  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <p className="text-sm text-muted-foreground">Loading note…</p>
      </div>
    );
  }

  if (isError || !note) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <p className="text-sm text-destructive">
          {(error as Error)?.message ?? "Note not found"}
        </p>
      </div>
    );
  }

  const folderLabel =
    placement.kind === "folder"
      ? placement.name
      : placement.kind === "notebook"
        ? placement.name
        : "Loose note";

  const FolderIcon =
    placement.kind === "notebook"
      ? BookOpen
      : placement.kind === "folder"
        ? Folder
        : FileText;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-1px)] max-w-3xl flex-col px-4 pb-16 pt-4 sm:px-6">
      {/* ============ Toolbar ============ */}
      <div className="sticky top-0 z-30 -mx-4 mb-8 flex items-center justify-between gap-3 border-b border-border/60 bg-background/80 px-4 py-2 backdrop-blur-md sm:-mx-6 sm:px-6">
        {/* Left: back + status */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/notes")}
            className="-ml-1 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Notes</span>
          </button>
          <SaveStatusIndicator status={saveStatus} />
        </div>

        {/* Right: folder pill + overflow */}
        <div className="flex items-center gap-1.5">
          {/* Folder pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setFolderMenuOpen((v) => !v)}
              className={cn(
                "inline-flex max-w-[220px] items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                folderMenuOpen && "bg-accent text-foreground",
              )}
              aria-haspopup="menu"
              aria-expanded={folderMenuOpen}
            >
              <FolderIcon className="h-3.5 w-3.5 shrink-0 opacity-80" />
              <span className="truncate">{folderLabel}</span>
            </button>

            <Popover
              open={folderMenuOpen}
              onClose={() => setFolderMenuOpen(false)}
            >
              <div className="px-2.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Move to
              </div>
              <PopoverItem
                icon={FileText}
                label="Loose note"
                active={placement.kind === "loose"}
                onClick={() => handleMove({ kind: "loose" })}
              />
              {folders.filter((f) => !f.isTrashed).length > 0 && (
                <div className="px-2.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Folders
                </div>
              )}
              {folders
                .filter((f) => !f.isTrashed)
                .map((f) => (
                  <PopoverItem
                    key={f.id}
                    icon={Folder}
                    label={f.name}
                    active={
                      placement.kind === "folder" && placement.id === f.id
                    }
                    onClick={() =>
                      handleMove({ kind: "folder", id: f.id, name: f.name })
                    }
                  />
                ))}
              {notebooks.filter((n) => !n.isTrashed).length > 0 && (
                <div className="px-2.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Notebooks
                </div>
              )}
              {notebooks
                .filter((n) => !n.isTrashed)
                .map((n) => (
                  <PopoverItem
                    key={n.id}
                    icon={BookOpen}
                    label={n.name}
                    active={
                      placement.kind === "notebook" && placement.id === n.id
                    }
                    onClick={() =>
                      handleMove({
                        kind: "notebook",
                        id: n.id,
                        name: n.name,
                      })
                    }
                  />
                ))}
            </Popover>
          </div>

          {/* Overflow menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOverflowOpen((v) => !v)}
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                overflowOpen && "bg-accent text-foreground",
              )}
              aria-label="More options"
              aria-haspopup="menu"
              aria-expanded={overflowOpen}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            <Popover
              open={overflowOpen}
              onClose={() => {
                setOverflowOpen(false);
                setConfirmingDelete(false);
              }}
              className="min-w-[220px]"
            >
              {!confirmingDelete ? (
                <PopoverItem
                  icon={Trash2}
                  label={
                    deleteNoteMutation.isPending
                      ? "Deleting…"
                      : "Delete note"
                  }
                  danger
                  onClick={() => setConfirmingDelete(true)}
                />
              ) : (
                <div className="p-1.5">
                  <p className="mb-2 px-1 text-xs text-muted-foreground">
                    Delete this note? This can't be undone.
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
                      disabled={deleteNoteMutation.isPending}
                      className="flex-1 rounded-lg bg-destructive px-2 py-1.5 text-xs font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
                    >
                      {deleteNoteMutation.isPending ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              )}
            </Popover>
          </div>
        </div>
      </div>

      {/* ============ Writing surface ============ */}
      <div className="flex-1">
        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled"
          className="w-full resize-none border-none bg-transparent text-3xl font-bold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/40 sm:text-4xl"
          spellCheck={false}
        />

        {/* Hairline divider — fades when typing */}
        <div className="my-5 h-px w-full bg-border/70" />

        {/* Body */}
        <textarea
          ref={bodyRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing…"
          className="w-full resize-none overflow-hidden border-none bg-transparent text-base leading-7 text-foreground outline-none placeholder:text-muted-foreground/40"
          spellCheck={false}
          rows={1}
        />
      </div>

      {/* ============ Footer meta ============ */}
      <div className="mt-12 flex items-center justify-center text-[11px] text-muted-foreground/70">
        <span>
          Created {new Date(note.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
        <span className="mx-2">·</span>
        <span>
          Edited{" "}
          {new Date(note.updatedAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
    </div>
  );
}