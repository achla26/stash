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
   Tiny markdown preview (dependency-free, safe React nodes)
   ============================================================ */

function renderInline(text: string, keyBase: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const regex =
    /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|_[^_]+_|\[[^\]]+\]\([^)\s]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = regex.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const tok = m[0];
    const k = `${keyBase}-${i++}`;
    if (tok.startsWith("**")) {
      nodes.push(
        <strong key={k} className="font-semibold text-foreground">
          {tok.slice(2, -2)}
        </strong>
      );
    } else if (tok.startsWith("`")) {
      nodes.push(
        <code
          key={k}
          className="rounded bg-accent px-1 py-0.5 font-mono text-[0.85em]"
        >
          {tok.slice(1, -1)}
        </code>
      );
    } else if (tok.startsWith("*") || tok.startsWith("_")) {
      nodes.push(<em key={k}>{tok.slice(1, -1)}</em>);
    } else {
      const mm = tok.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (mm) {
        nodes.push(
          <a
            key={k}
            href={mm[2]}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline underline-offset-2"
          >
            {mm[1]}
          </a>
        );
      }
    }
    last = m.index + tok.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function isBlockStart(line: string): boolean {
  return (
    /^#{1,3}\s?/.test(line) ||
    /^>\s?/.test(line) ||
    /^[-*]\s/.test(line) ||
    /^\d+\.\s/.test(line) ||
    line.startsWith("```") ||
    /^[-*]\s\[[ xX]\]\s/.test(line)
  );
}

function MarkdownPreview({ text }: { text: string }) {
  // iOS/paste lookalikes → ascii so markdown always converts
  text = text.replace(/[*＊∗✱⁎]/g, "*").replace(/ /g, " ");
  const lines = text.split("\n");
  const out: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";

    if (line.startsWith("```")) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !(lines[i] ?? "").startsWith("```")) {
        buf.push(lines[i] ?? "");
        i++;
      }
      i++; // closing fence
      out.push(
        <pre
          key={key++}
          className="my-3 overflow-x-auto rounded-xl border border-border bg-accent/50 p-3 font-mono text-[13px] leading-relaxed"
        >
          {buf.join("\n")}
        </pre>
      );
      continue;
    }

    if (/^###\s?/.test(line)) {
      out.push(
        <h3 key={key++} className="mt-5 mb-1.5 text-lg font-semibold">
          {renderInline(line.replace(/^###\s?/, ""), `h3${key}`)}
        </h3>
      );
      i++;
      continue;
    }
    if (/^##\s?/.test(line)) {
      out.push(
        <h2 key={key++} className="mt-6 mb-2 text-xl font-bold">
          {renderInline(line.replace(/^##\s?/, ""), `h2${key}`)}
        </h2>
      );
      i++;
      continue;
    }
    if (/^#\s?/.test(line)) {
      out.push(
        <h1 key={key++} className="mt-6 mb-2 text-2xl font-bold">
          {renderInline(line.replace(/^#\s?/, ""), `h1${key}`)}
        </h1>
      );
      i++;
      continue;
    }

    if (/^>\s?/.test(line)) {
      out.push(
        <blockquote
          key={key++}
          className="my-3 border-l-2 border-primary/50 pl-3 text-muted-foreground"
        >
          {renderInline(line.replace(/^>\s?/, ""), `q${key}`)}
        </blockquote>
      );
      i++;
      continue;
    }

    const task = line.match(/^[-*]\s\[( |x|X)\]\s(.*)$/);
    if (task) {
      out.push(
        <div key={key++} className="my-1 flex items-start gap-2">
          <span
            className={cn(
              "mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
              task[1] !== " "
                ? "border-primary bg-primary text-white"
                : "border-border"
            )}
          >
            {task[1] !== " " && <Check className="h-3 w-3" />}
          </span>
          <span className={task[1] !== " " ? "line-through opacity-60" : ""}>
            {renderInline(task[2] ?? "", `t${key}`)}
          </span>
        </div>
      );
      i++;
      continue;
    }

    if (/^[-*]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").replace(/^[-*]\s/, ""));
        i++;
      }
      out.push(
        <ul key={key++} className="my-2 list-disc space-y-1 pl-5">
          {items.map((it, j) => (
            <li key={j}>{renderInline(it, `ul${key}-${j}`)}</li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").replace(/^\d+\.\s/, ""));
        i++;
      }
      out.push(
        <ol key={key++} className="my-2 list-decimal space-y-1 pl-5">
          {items.map((it, j) => (
            <li key={j}>{renderInline(it, `ol${key}-${j}`)}</li>
          ))}
        </ol>
      );
      continue;
    }

    if (line.trim() === "") {
      i++;
      continue;
    }

    if (/^[-*_]{3,}\s*$/.test(line)) {
      out.push(<hr key={key++} className="my-6 border-border" />);
      i++;
      continue;
    }

    // consecutive plain lines = one paragraph, single newlines render as <br/>
    const buf: string[] = [line];
    while (i + 1 < lines.length) {
      const nxt = lines[i + 1] ?? "";
      if (nxt.trim() === "" || isBlockStart(nxt)) break;
      buf.push(nxt);
      i++;
    }
    out.push(
      <p key={key++} className="my-2">
        {buf.map((b, j) => (
          <span key={j}>
            {j > 0 && <br />}
            {renderInline(b, `p${key}-${j}`)}
          </span>
        ))}
      </p>
    );
    i++;
  }

  return (
    <div className="text-[17px] leading-[1.75] text-foreground">
      {out.length ? out : <p className="text-muted-foreground/50">Nothing to preview.</p>}
    </div>
  );
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
  }, [content, resizeBody, preview]);

  /* ---------- Dirty tracking ---------- */
  const debouncedTitle = useDebounce(title, 800);
  const previewContent = useDebounce(content, 200);
  const debouncedContent = useDebounce(content, 800);

  const originalTitle = useMemo(() => note?.title ?? "", [note?.title]);
  const originalContent = useMemo(
    () => getTextContent(note?.content),
    [note?.content]
  );

  useEffect(() => {
    if (isFirstLoad.current) return;
    if (title !== originalTitle || content !== originalContent) {
      setSaveStatus("unsaved");
    }
  }, [title, content, originalTitle, originalContent]);

  /* ---------- Save ---------- */
  const doSave = useCallback(
    (t: string, c: string) => {
      if (!noteId) return;
      setSaveStatus("saving");
      updateNoteMutation.mutate(
        { id: noteId, title: t.trim() || "Untitled", content: c },
        {
          onSuccess: () => {
            setSaveStatus("saved");
            if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
            savedTimerRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
          },
          onError: () => setSaveStatus("unsaved"),
        }
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [noteId]
  );

  /* ---------- Autosave ---------- */
  useEffect(() => {
    if (isFirstLoad.current) return;
    if (!noteId) return;
    const hasChanges =
      debouncedTitle !== originalTitle || debouncedContent !== originalContent;
    if (!hasChanges) return;
    doSave(debouncedTitle, debouncedContent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTitle, debouncedContent]);

  /* ---------- Save when leaving / hiding (mobile app switch) ---------- */
  useEffect(() => {
    const flush = () => {
      // never flush before the note has loaded, and never flush clean state —
      // otherwise an app-switch on a slow load overwrites the note with ""
      if (isFirstLoad.current) return;
      if (title === originalTitle && content === originalContent) return;
      doSave(title, content);
    };
    const onVis = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("beforeunload", flush);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [doSave, title, content, originalTitle, originalContent]);

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
            <SaveIndicator status={saveStatus} />
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
            <button type="button" className={toolBtn} title="Bold (⌘B)" onClick={() => { setPreview(false); wrapSelection("**", "**"); }}>
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
          </div>
        )}
      </div>

      {/* Overflow popover */}
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
