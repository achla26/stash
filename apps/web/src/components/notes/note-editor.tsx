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
  Bold,
  Italic,
  Heading2,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  Quote,
  Eye,
  PencilLine,
  Highlighter,
  Palette,
  ImagePlus,
  Globe,
  Link2,
  Copy,
} from "lucide-react";

import { useDeleteNote, useNote, useUpdateNote } from "@/hooks/use-notes";
import { useFolders } from "@/hooks/use-folder";
import { useNotebooks } from "@/hooks/use-notebooks";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { MarkdownPreview } from "./markdown-preview";

/* ============================================================
   Helpers
   ============================================================ */

function getTextContent(content: string | null | undefined): string {
  if (!content) return "";
  return content;
}

type SaveStatus = "idle" | "saved" | "unsaved" | "saving" | "error";

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
        active && "bg-accent"
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

function SaveIndicator({ status, onRetry }: { status: SaveStatus; onRetry?: () => void }) {
  if (status === "error") {
    return (
      <button
        type="button"
        onClick={onRetry}
        className="flex items-center gap-1.5 text-xs font-medium text-destructive"
        title="Save failed — tap to retry"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
        <span>Save failed — retry</span>
      </button>
    );
  }
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
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
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
  const [preview, setPreview] = useState(() => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches);
  const [isDesktop] = useState(() => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches);

  const [overflowOpen, setOverflowOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [colorPanel, setColorPanel] = useState<"none" | "text" | "highlight">("none");
  const [sharePanel, setSharePanel] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Data-loss fix:
  // - loadedRef     → server note has been loaded into the editor at least once
  // - lastSyncedRef → last title/content known to be on the server
  // - latestRef     → always-current state, readable from event handlers
  const loadedRef = useRef(false);
  const lastSyncedRef = useRef({ title: "", content: "" });
  const latestRef = useRef({ title: "", content: "" });
  const prevNoteIdRef = useRef<string | undefined>(undefined);
  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const overflowBtnRef = useRef<HTMLButtonElement>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  latestRef.current = { title, content };

  const isDirtyNow = () =>
    latestRef.current.title !== lastSyncedRef.current.title ||
    latestRef.current.content !== lastSyncedRef.current.content;

  /* ---------- keepalive save — survives tab close / app switch / suspension ---------- */
  const keepaliveSave = useCallback((id: string, t: string, c: string) => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    fetch(`/api/notes/${id}`, {
      method: "PATCH",
      keepalive: true,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ title: t.trim() || "Untitled", content: c }),
    })
      .then((r) => {
        if (r.ok) {
          lastSyncedRef.current = { title: t, content: c };
          setSaveStatus("saved");
        } else {
          setSaveStatus("error");
        }
      })
      .catch(() => setSaveStatus("error"));
  }, []);

  /* ---------- Switching notes → hard reset (flush pending changes first) ---------- */
  useEffect(() => {
    if (prevNoteIdRef.current === noteId) return;
    const prevId = prevNoteIdRef.current;
    if (prevId && isDirtyNow()) {
      keepaliveSave(prevId, latestRef.current.title, latestRef.current.content);
    }
    prevNoteIdRef.current = noteId;
    loadedRef.current = false;
    lastSyncedRef.current = { title: "", content: "" };
    setTitle("");
    setContent("");
    setSaveStatus("idle");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId]);

  /* ---------- Load note — NEVER overwrites unsaved user typing ---------- */
  useEffect(() => {
    if (!note || loadedRef.current) return;
    if ((note as { id?: string }).id && (note as { id?: string }).id !== noteId) return;
    loadedRef.current = true;

    const userAlreadyTyped =
      title !== lastSyncedRef.current.title || content !== lastSyncedRef.current.content;
    if (userAlreadyTyped) {
      // User typed before the note finished loading — keep their text,
      // autosave will push it to the server.
      return;
    }

    const loadedTitle = note.title ?? "";
    const loadedContent = getTextContent(note.content);
    lastSyncedRef.current = { title: loadedTitle, content: loadedContent };
    setTitle(loadedTitle);
    setContent(loadedContent);

    if (!loadedTitle && !loadedContent) {
      setTimeout(() => titleRef.current?.focus(), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note, noteId, title, content]);

  /* ---------- Auto-grow textarea ---------- */
  const resizeBody = useCallback(() => {
    const el = bodyRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    resizeBody();
  }, [content, resizeBody, preview]);

  const previewContent = useDebounce(content, 200);

  /* ---------- Save ---------- */
  const doSave = useCallback(
    (t: string, c: string) => {
      if (!noteId) return;
      setSaveStatus("saving");
      updateNoteMutation.mutate(
        { id: noteId, title: t.trim() || "Untitled", content: c },
        {
          onSuccess: () => {
            lastSyncedRef.current = { title: t, content: c };
            setSaveStatus("saved");
            if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
            savedTimerRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
          },
          onError: () => setSaveStatus("error"),
        }
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [noteId]
  );

  /* ---------- Autosave — 1.2s after typing stops, works even before load finishes ---------- */
  useEffect(() => {
    const dirty =
      title !== lastSyncedRef.current.title || content !== lastSyncedRef.current.content;
    if (!dirty || !noteId) return;
    setSaveStatus((s) => (s === "error" || s === "saving" ? s : "unsaved"));
    const timer = setTimeout(() => doSave(title, content), 1200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, noteId, doSave]);

  /* ---------- Save when leaving / hiding (tab close, mobile app switch) ---------- */
  useEffect(() => {
    const flush = () => {
      if (!noteId) return;
      if (!isDirtyNow()) return;
      keepaliveSave(noteId, latestRef.current.title, latestRef.current.content);
    };
    const onVis = () => {
      if (document.visibilityState === "hidden") flush();
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirtyNow()) return;
      flush();
      e.preventDefault();
      e.returnValue = "";
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", onBeforeUnload);
      flush(); // SPA unmount (e.g. back to notes list) — never lose typed text
    };
  }, [noteId, keepaliveSave]);

  /* ---------- Markdown helpers ---------- */
  const wrapSelection = (before: string, after: string) => {
    const el = bodyRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.slice(start, end) || "text";
    const wrapped = `${before}${selected}${after}`;
    const next = content.slice(0, start) + wrapped + content.slice(end);
    setContent(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  };

  const applyLinePrefix = (prefix: string | ((i: number) => string), strip?: RegExp) => {
    const el = bodyRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const lineStart = content.lastIndexOf("\n", start - 1) + 1;
    let lineEnd = content.indexOf("\n", end);
    if (lineEnd === -1) lineEnd = content.length;
    const block = content.slice(lineStart, lineEnd);
    const lines = block.split("\n");
    const allHave = strip ? lines.every((l) => strip.test(l)) : false;
    const newBlock = lines
      .map((l, idx) => {
        if (allHave && strip) return l.replace(strip, "");
        if (strip && strip.test(l)) return l; // mixed: don't double
        return typeof prefix === "function" ? prefix(idx) + l : prefix + l;
      })
      .join("\n");
    setContent(content.slice(0, lineStart) + newBlock + content.slice(lineEnd));
    requestAnimationFrame(() => el.focus());
  };

  /* ---------- Image upload (paste / button) ---------- */
  const insertAtCursor = (snippet: string) => {
    const el = bodyRef.current;
    const pos = el ? el.selectionStart : content.length;
    const next = content.slice(0, pos) + snippet + content.slice(pos);
    setContent(next);
    requestAnimationFrame(() => {
      el?.focus();
      const p = pos + snippet.length;
      el?.setSelectionRange(p, p);
    });
  };

  const compressImage = (file: File): Promise<Blob> =>
    new Promise((resolve) => {
      if (file.type === "image/gif" || file.size < 300 * 1024) {
        resolve(file);
        return;
      }
      const url = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => {
        const max = 1600;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        canvas.toBlob(
          (b) => resolve(b ?? file),
          "image/jpeg",
          0.85
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };
      img.src = url;
    });

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) {
      setSaveStatus("unsaved");
      return;
    }
    setUploading(true);
    try {
      const blob = await compressImage(file);
      const fd = new FormData();
      fd.append("file", blob, blob.type === "image/png" ? "image.png" : "image.jpg");
      const token = localStorage.getItem("access_token");
      const res = await fetch("/api/uploads", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: fd,
      });
      if (!res.ok) throw new Error("upload failed");
      const json = await res.json();
      insertAtCursor(`![](${json.data.url})\n\n`);
    } catch {
      // silently ignore — user can retry
    } finally {
      setUploading(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const it of items) {
      if (it.type.startsWith("image/")) {
        e.preventDefault();
        const f = it.getAsFile();
        if (f) void uploadImage(f);
        return;
      }
    }
  };

  /* ---------- Color helpers ---------- */
  const wrapColor = (kind: "text" | "highlight", color: string) => {
    if (kind === "highlight") {
      wrapSelection(`<mark style="background-color:${color}">`, "</mark>");
    } else {
      wrapSelection(`<span style="color:${color}">`, "</span>");
    }
    setColorPanel("none");
  };

  const HIGHLIGHT_COLORS = ["#FEF08A", "#BBF7D0", "#BFDBFE", "#FBCFE8"];
  const TEXT_COLORS = ["#FF3B30", "#FF9500", "#34C759", "#007AFF", "#AF52DE"];

  /* ---------- Smart textarea keys: lists continue, Tab indents ---------- */
  const handleBodyKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart;
      setContent(content.slice(0, start) + "  " + content.slice(el.selectionEnd));
      requestAnimationFrame(() => el.setSelectionRange(start + 2, start + 2));
      return;
    }
    if (e.key === "Enter") {
      const el = e.currentTarget;
      const start = el.selectionStart;
      const before = content.slice(0, start);
      const lineStart = before.lastIndexOf("\n") + 1;
      const line = before.slice(lineStart);
      const m = line.match(/^(\s*)([-*] \[[ xX]\] |[-*] |(\d+)\. )(.*)$/);
      if (!m) return;
      e.preventDefault();
      const [, indent = "", marker = "", num, rest = ""] = m;
      if (!rest.trim()) {
        // empty list item → exit list
        setContent(content.slice(0, lineStart) + "\n" + content.slice(start));
        const pos = lineStart + 1;
        requestAnimationFrame(() => el.setSelectionRange(pos, pos));
        return;
      }
      let next = marker;
      if (num) next = `${parseInt(num, 10) + 1}. `;
      else if (/\[[xX]\]/.test(marker)) next = "- [ ] ";
      const insert = `\n${indent}${next}`;
      setContent(content.slice(0, start) + insert + content.slice(el.selectionEnd));
      const pos = start + insert.length;
      requestAnimationFrame(() => el.setSelectionRange(pos, pos));
    }
  };

  /* ---------- Keyboard shortcuts ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        doSave(title, content);
      }
      if (mod && e.key.toLowerCase() === "b") {
        e.preventDefault();
        wrapSelection("**", "**");
      }
      if (mod && e.key.toLowerCase() === "i") {
        e.preventDefault();
        wrapSelection("*", "*");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, noteId, doSave]);

  /* ---------- Placement ---------- */
  const placement: Placement = useMemo(() => {
    if (note?.notebookId) {
      const nb = notebooks.find((n) => n.id === note.notebookId);
      return { kind: "notebook", id: note.notebookId, name: nb?.name ?? "Notebook" };
    }
    if (note?.folderId) {
      const f = folders.find((x) => x.id === note.folderId);
      return { kind: "folder", id: note.folderId, name: f?.name ?? "Folder" };
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
  const charCount = content.length;
  const readMins = Math.max(1, Math.round(wordCount / 200));
  const FolderIcon =
    placement.kind === "notebook"
      ? BookOpen
      : placement.kind === "folder"
        ? Folder
        : FileText;

  const toolBtn =
    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";

  return (
    <div className="min-h-screen bg-background">
      {/* Toolbar */}
      <div className={cn("mx-auto w-full px-6 pt-6 sm:px-8", preview ? "max-w-none lg:px-10" : "max-w-2xl md:max-w-3xl")}>
        <div className="flex items-center justify-between gap-3 opacity-60 transition-opacity hover:opacity-100 focus-within:opacity-100">
          <button
            type="button"
            onClick={() => router.push("/notes")}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Back to notes"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="flex h-8 min-w-[100px] items-center justify-center">
            <SaveIndicator status={saveStatus} onRetry={() => doSave(title, content)} />
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPreview((v) => !v)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                preview && "bg-accent text-foreground"
              )}
              aria-label={preview ? "Edit" : "Preview"}
              title={preview ? "Edit" : "Preview"}
            >
              {preview ? <PencilLine className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            <button
              ref={overflowBtnRef}
              type="button"
              onClick={() => setOverflowOpen((v) => !v)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                overflowOpen && "bg-accent text-foreground"
              )}
              aria-label="More options"
              aria-haspopup="menu"
              aria-expanded={overflowOpen}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Formatting toolbar (edit mode only) */}
        {(!preview || isDesktop) && (
          <div className="mt-4 flex items-center gap-0.5 overflow-x-auto border-b border-border/60 pb-2 opacity-70 transition-opacity hover:opacity-100 focus-within:opacity-100">
            <button type="button" className={toolBtn} title="Bold (⌘B)" onClick={() => { wrapSelection("**", "**"); }}>
              <Bold className="h-3.5 w-3.5" />
            </button>
            <button type="button" className={toolBtn} title="Italic (⌘I)" onClick={() => wrapSelection("*", "*")}>
              <Italic className="h-3.5 w-3.5" />
            </button>
            <button type="button" className={toolBtn} title="Heading" onClick={() => applyLinePrefix("## ", /^##\s/)}>
              <Heading2 className="h-3.5 w-3.5" />
            </button>
            <button type="button" className={toolBtn} title="Bullet list" onClick={() => applyLinePrefix("- ", /^[-*]\s(?!\[)/)}>
              <List className="h-3.5 w-3.5" />
            </button>
            <button type="button" className={toolBtn} title="Numbered list" onClick={() => applyLinePrefix((i) => `${i + 1}. `, /^\d+\.\s/)}>
              <ListOrdered className="h-3.5 w-3.5" />
            </button>
            <button type="button" className={toolBtn} title="Checklist" onClick={() => applyLinePrefix("- [ ] ", /^[-*]\s\[[ xX]\]\s/)}>
              <CheckSquare className="h-3.5 w-3.5" />
            </button>
            <button type="button" className={toolBtn} title="Code" onClick={() => wrapSelection("`", "`")}>
              <Code className="h-3.5 w-3.5" />
            </button>
            <button type="button" className={toolBtn} title="Quote" onClick={() => applyLinePrefix("> ", /^>\s/)}>
              <Quote className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className={cn(toolBtn, colorPanel === "highlight" && "bg-accent text-foreground")}
              title="Highlight"
              onClick={() => setColorPanel((v) => (v === "highlight" ? "none" : "highlight"))}
            >
              <Highlighter className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className={cn(toolBtn, colorPanel === "text" && "bg-accent text-foreground")}
              title="Text color"
              onClick={() => setColorPanel((v) => (v === "text" ? "none" : "text"))}
            >
              <Palette className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className={toolBtn}
              title="Add image"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ImagePlus className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        )}

        {/* Color swatches */}
        {colorPanel !== "none" && (
          <div className="mt-2 flex items-center gap-2 pb-1">
            {(colorPanel === "highlight" ? HIGHLIGHT_COLORS : TEXT_COLORS).map((c) => (
              <button
                key={c}
                type="button"
                aria-label={colorPanel === "highlight" ? `Highlight ${c}` : `Text color ${c}`}
                onClick={() => wrapColor(colorPanel, c)}
                className="h-6 w-6 rounded-full border border-border transition-transform hover:scale-110"
                style={
                  colorPanel === "highlight"
                    ? { backgroundColor: c }
                    : { backgroundColor: c }
                }
              />
            ))}
            <button
              type="button"
              onClick={() => setColorPanel("none")}
              className="ml-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              Done
            </button>
          </div>
        )}

        {/* Hidden image file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void uploadImage(f);
            e.target.value = "";
          }}
        />
      </div>

      {/* Overflow popover */}
      <AnchoredPopover
        anchorRef={overflowBtnRef}
        open={overflowOpen}
        onClose={() => {
          setOverflowOpen(false);
          setConfirmingDelete(false);
          setShowFolderPicker(false);
          setSharePanel(false);
          setCopied(false);
        }}
      >
        {!confirmingDelete && !showFolderPicker && !sharePanel && (
          <>
            <PopoverItem
              icon={FolderIcon}
              label="Move to…"
              onClick={() => setShowFolderPicker(true)}
            />
            <PopoverItem
              icon={Globe}
              label={note.isPublic ? "Sharing: ON" : "Share publicly"}
              onClick={() => setSharePanel(true)}
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
                  active={placement.kind === "folder" && placement.id === f.id}
                  onClick={() => handleMove({ kind: "folder", id: f.id, name: f.name })}
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
                  active={placement.kind === "notebook" && placement.id === n.id}
                  onClick={() => handleMove({ kind: "notebook", id: n.id, name: n.name })}
                />
              ))}
          </>
        )}

        {sharePanel && (
          <div className="w-72 p-2.5">
            <p className="mb-2 text-xs font-medium text-foreground">
              {note.isPublic ? "Public link" : "Share this note"}
            </p>
            {note.isPublic ? (
              <>
                <div className="flex items-center gap-1.5">
                  <input
                    readOnly
                    value={`${typeof window !== "undefined" ? window.location.origin : ""}/n/${note.publicSlug}`}
                    onFocus={(e) => e.target.select()}
                    className="min-w-0 flex-1 rounded-lg border border-border bg-accent/50 px-2 py-1.5 text-[11px] text-muted-foreground outline-none"
                  />
                  <button
                    type="button"
                    aria-label="Copy link"
                    onClick={() => {
                      void navigator.clipboard?.writeText(
                        `${window.location.origin}/n/${note.publicSlug}`
                      );
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
                  Anyone with this link can read — login ki zaroorat nahi.
                </p>
                <button
                  type="button"
                  disabled={updateNoteMutation.isPending}
                  onClick={() => updateNoteMutation.mutate({ id: noteId!, isPublic: false })}
                  className="mt-2 w-full rounded-lg border border-border px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent disabled:opacity-50"
                >
                  Stop sharing
                </button>
              </>
            ) : (
              <>
                <p className="mb-2 text-[11px] leading-snug text-muted-foreground">
                  Note sabke liye readable ho jayega (blog jaisa public link). Edit sirf tum kar sakti ho.
                </p>
                <button
                  type="button"
                  disabled={updateNoteMutation.isPending}
                  onClick={() =>
                    updateNoteMutation.mutate(
                      { id: noteId!, isPublic: true },
                      { onSuccess: () => setCopied(false) }
                    )
                  }
                  className="w-full rounded-lg bg-primary px-2 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {updateNoteMutation.isPending ? "Working…" : "Make public"}
                </button>
              </>
            )}
          </div>
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

      {/* Writing surface / preview */}
      <div
        className={cn(
          "mx-auto w-full px-6 pb-24 pt-6 sm:px-8",
          preview ? "max-w-none lg:px-10" : "max-w-2xl md:max-w-3xl"
        )}
      >
        {preview ? (
          <div className="gap-12 md:grid md:grid-cols-2">
            {/* live editor — desktop only */}
            <div className="hidden md:block">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Untitled"
                className="w-full resize-none border-none bg-transparent text-4xl font-bold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/25 sm:text-5xl"
                spellCheck={false}
              />
              <textarea
                ref={bodyRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleBodyKeyDown}
                onPaste={handlePaste}
                placeholder="Start writing…"
                className="mt-8 w-full resize-none overflow-hidden border-none bg-transparent text-[17px] leading-[1.75] text-foreground outline-none placeholder:text-muted-foreground/25"
                spellCheck={false}
                rows={1}
              />
            </div>
            {/* preview column */}
            <div className="min-w-0">
              <h1 className="w-full text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                {title || "Untitled"}
              </h1>
              <div className="mt-8">
                <MarkdownPreview text={previewContent} />
              </div>
            </div>
          </div>
        ) : (
          <>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled"
              className="w-full resize-none border-none bg-transparent text-4xl font-bold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/25 sm:text-5xl"
              spellCheck={false}
            />
            <textarea
              ref={bodyRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleBodyKeyDown}
                onPaste={handlePaste}
              placeholder="Start writing…  ( - list, - [ ] checklist, # heading )"
              className="mt-8 w-full resize-none overflow-hidden border-none bg-transparent text-[17px] leading-[1.75] text-foreground outline-none placeholder:text-muted-foreground/25"
              spellCheck={false}
              rows={1}
            />
          </>
        )}

        {/* Bottom meta */}
        {(wordCount > 0 || charCount > 0) && (
          <div className="mt-16 text-right text-[11px] text-muted-foreground/50">
            {wordCount} {wordCount === 1 ? "word" : "words"}
            {charCount > 0 && <> · {charCount} chars</>}
            {wordCount > 0 && <> · ~{readMins} min read</>}
          </div>
        )}
      </div>
    </div>
  );
}
