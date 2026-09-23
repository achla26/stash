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

type SaveStatus = "idle" | "saved" | "unsaved" | "saving";

type Placement =
  | { kind: "loose" }
  | { kind: "folder"; id: string; name: string }
  | { kind: "notebook"; id: string; name: string };

function countWords(text: string): number {
  const t = text.trim();
  if (!t) return 0;
  return t.split(/\s+/).length;
}

/* ============================================================
   Popover — anchored to a trigger element, uses fixed positioning
   so it never clips on mobile or inside overflow-hidden parents.
   ============================================================ */

function AnchoredPopover({
  anchorRef,
  open,
  onClose,
  children,
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const popRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; right: number }>({
    top: 0,
    right: 0,
  });

  // Compute position whenever open
  useEffect(() => {
    if (!open) return;
    const compute = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      setPos({
        top: rect.bottom + 8,
        right: Math.max(8, window.innerWidth - rect.right),
      });
    };
    compute();
    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, true);
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
    };
  }, [open, anchorRef]);

  // Close on outside click + Escape
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (popRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
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
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return (
    <div
      ref={popRef}
      style={{ top: pos.top, right: pos.right }}
      className="fixed z-50 min-w-[240px] max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-lg"
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
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  danger?: boolean;
  active?: boolean;
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
      {active && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
    </button>
  );
}

/* ============================================================
   Save status
   ============================================================ */

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "saving") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Saving…</span>
      </div>
    );
  }
  if (status === "saved") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground animate-fade-out">
        <Check className="h-3 w-3 text-success" />
        <span>Saved</span>
      </div>
    );
  }
  if (status === "unsaved") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-warning">
        <span className="h-1.5 w-1.5 rounded-full bg-warning" />
        <span>Unsaved</span>
      </div>
    );
  }
  return null;
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
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const [overflowOpen, setOverflowOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [showFolderPicker, setShowFolderPicker] = useState(false);

  const isFirstLoad = useRef(true);
  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const overflowBtnRef = useRef<HTMLButtonElement>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---------- Load note once ---------- */
  useEffect(() => {
    if (note && isFirstLoad.current) {
      const loadedTitle = note.title ?? "";
      const loadedContent = getTextContent(note.content);
      setTitle(loadedTitle);
      setContent(loadedContent);
      isFirstLoad.current = false;

      if (!loadedTitle && !loadedContent) {
        setTimeout(() => titleRef.current?.focus(), 100);
      }
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
        onSuccess: () => {
          setSaveStatus("saved");
          if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
          savedTimerRef.current = setTimeout(() => {
            setSaveStatus("idle");
          }, 2000);
        },
        onError: () => setSaveStatus("unsaved"),
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTitle, debouncedContent]);

  /* ---------- Markdown wrap helper ---------- */
  const wrapSelection = (before: string, after: string) => {
    const el = bodyRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.slice(start, end);
    const wrapped = `${before}${selected}${after}`;
    const next = content.slice(0, start) + wrapped + content.slice(end);
    setContent(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + before.length, end + before.length);
    });
  };

  /* ---------- Keyboard shortcuts ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        setSaveStatus("saving");
        updateNoteMutation.mutate(
          {
            id: noteId,
            title: title.trim() || "Untitled",
            content,
          },
          {
            onSuccess: () => {
              setSaveStatus("saved");
              if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
              savedTimerRef.current = setTimeout(() => {
                setSaveStatus("idle");
              }, 2000);
            },
            onError: () => setSaveStatus("unsaved"),
          },
        );
      }

      if (mod && e.key.toLowerCase() === "b") {
        e.preventDefault();
        wrapSelection("**", "**");
      }

      if (mod && e.key.toLowerCase() === "i") {
        e.preventDefault();
        wrapSelection("_", "_");
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, noteId]);

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
    setShowFolderPicker(false);
    setOverflowOpen(false);
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
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !note) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-destructive">
          {(error as Error)?.message ?? "Note not found"}
        </p>
      </div>
    );
  }

  const wordCount = countWords(content);
  const FolderIcon =
    placement.kind === "notebook"
      ? BookOpen
      : placement.kind === "folder"
        ? Folder
        : FileText;

  return (
    <div className="min-h-screen bg-background">
      {/* ============================================================
          Toolbar — in-page, top of content
          ============================================================ */}
      <div className="mx-auto max-w-2xl px-6 pt-6 sm:px-8">
        <div className="flex items-center justify-between gap-3 opacity-60 transition-opacity hover:opacity-100 focus-within:opacity-100">
          {/* Left: back */}
          <button
            type="button"
            onClick={() => router.push("/notes")}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Back to notes"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          {/* Center: save status */}
          <div className="flex h-8 min-w-[100px] items-center justify-center">
            <SaveIndicator status={saveStatus} />
          </div>

          {/* Right: overflow button — popover is rendered separately */}
          <button
            ref={overflowBtnRef}
            type="button"
            onClick={() => setOverflowOpen((v) => !v)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              overflowOpen && "bg-accent text-foreground",
            )}
            aria-label="More options"
            aria-haspopup="menu"
            aria-expanded={overflowOpen}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Overflow popover — fixed positioned, anchored to overflowBtnRef */}
      <AnchoredPopover
        anchorRef={overflowBtnRef}
        open={overflowOpen}
        onClose={() => {
          setOverflowOpen(false);
          setConfirmingDelete(false);
          setShowFolderPicker(false);
        }}
      >
        {!confirmingDelete && !showFolderPicker && (
          <>
            <PopoverItem
              icon={FolderIcon}
              label="Move to…"
              onClick={() => setShowFolderPicker(true)}
            />
            <PopoverItem
              icon={Trash2}
              label="Delete note"
              danger
              onClick={() => setConfirmingDelete(true)}
            />
          </>
        )}

        {showFolderPicker && (
          <>
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
                    handleMove({
                      kind: "folder",
                      id: f.id,
                      name: f.name,
                    })
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
          </>
        )}

        {confirmingDelete && (
          <div className="p-2">
            <p className="mb-2 px-1 text-xs text-muted-foreground">
              Delete this note? This can&apos;t be undone.
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
      </AnchoredPopover>

      {/* ============================================================
          Writing surface
          ============================================================ */}
      <div className="mx-auto max-w-2xl px-6 pb-24 pt-6 sm:px-8">
        {/* Title */}
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled"
          className="w-full resize-none border-none bg-transparent text-4xl font-bold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/25 sm:text-5xl"
          spellCheck={false}
        />

        {/* Body */}
        <textarea
          ref={bodyRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing…"
          className="mt-8 w-full resize-none overflow-hidden border-none bg-transparent text-[17px] leading-[1.75] text-foreground outline-none placeholder:text-muted-foreground/25"
          spellCheck={false}
          rows={1}
        />

        {/* Bottom meta */}
        {wordCount > 0 && (
          <div className="mt-16 text-right text-[11px] text-muted-foreground/50">
            {wordCount} {wordCount === 1 ? "word" : "words"}
          </div>
        )}
      </div>
    </div>
  );
}