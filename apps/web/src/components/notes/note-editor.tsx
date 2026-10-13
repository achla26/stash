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
  Columns2,
  Highlighter,
  Palette,
  ImagePlus,
  Globe,
  Link2,
  Copy,
  Strikethrough,
  Minus,
} from "lucide-react";

import {
  useDeleteNote,
  useNote,
  useNotes,
  useUpdateNote,
} from "@/hooks/use-notes";
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
   Selection floating toolbar — Notion-style mini popup
   ============================================================ */

function SelectionToolbar({
  rect,
  onBold,
  onItalic,
  onStrike,
  onHighlight,
  onLink,
}: {
  rect: { top: number; left: number };
  onBold: () => void;
  onItalic: () => void;
  onStrike: () => void;
  onHighlight: () => void;
  onLink: (url: string) => void;
}) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [url, setUrl] = useState("");
  const keep = (e: React.MouseEvent) => e.preventDefault(); // keep textarea selection
  const btn =
    "flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";
  return (
    <div
      data-sel-toolbar
      style={{ top: Math.max(8, rect.top), left: rect.left }}
      className="animate-fade-up fixed z-50 flex -translate-x-1/2 items-center gap-0.5 rounded-xl border border-border bg-popover p-1 shadow-lg"
      onMouseDown={keep}
    >
      <button type="button" className={btn} title="Bold" onClick={onBold}>
        <Bold className="h-3.5 w-3.5" />
      </button>
      <button type="button" className={btn} title="Italic" onClick={onItalic}>
        <Italic className="h-3.5 w-3.5" />
      </button>
      <button type="button" className={btn} title="Strikethrough" onClick={onStrike}>
        <Strikethrough className="h-3.5 w-3.5" />
      </button>
      <button type="button" className={btn} title="Highlight" onClick={onHighlight}>
        <Highlighter className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        className={cn(btn, linkOpen && "bg-accent text-foreground")}
        title="Link"
        onClick={() => setLinkOpen((v) => !v)}
      >
        <Link2 className="h-3.5 w-3.5" />
      </button>
      {linkOpen && (
        <>
          <input
            autoFocus
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && url.trim()) onLink(url.trim());
            }}
            placeholder="https://…"
            className="h-7 w-36 rounded-md border border-input bg-background px-2 text-xs outline-none"
          />
          <button
            type="button"
            disabled={!url.trim()}
            onClick={() => url.trim() && onLink(url.trim())}
            className="h-7 rounded-md bg-primary px-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
          >
            Add
          </button>
        </>
      )}
    </div>
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
  const { data: allNotes = [] } = useNotes();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [viewMode, setViewMode] = useState<"split" | "view" | "edit">("edit");
  const [isDesktop] = useState(() => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches);
  const didInitPreview = useRef(false);
  const preview = viewMode !== "edit";

  /* Desktop: notes open in split view. Mobile: existing notes open in
     single view, new/empty notes in edit.
     Icon cycle — desktop: split → single view → edit → split;
     mobile: view ↔ edit. */
  useEffect(() => {
    if (didInitPreview.current || !note) return;
    didInitPreview.current = true;
    const hasContent = !!getTextContent(note.content).trim();
    setViewMode(!hasContent ? "edit" : isDesktop ? "split" : "view");
  }, [note, isDesktop]);


  const [overflowOpen, setOverflowOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [colorPanel, setColorPanel] = useState<"none" | "text" | "highlight">("none");
  const [sharePanel, setSharePanel] = useState(false);
  const [notePickerOpen, setNotePickerOpen] = useState(false);
  const [notePickerSearch, setNotePickerSearch] = useState("");
  const pickerNotes = allNotes
    .filter(
      (n) =>
        n.id !== noteId &&
        (n.title ?? "").toLowerCase().includes(notePickerSearch.toLowerCase())
    )
    .slice(0, 8);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [selRect, setSelRect] = useState<{ top: number; left: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const mirrorRef = useRef<HTMLDivElement | null>(null);
  const hlBtnRef = useRef<HTMLButtonElement>(null);
  const paletteBtnRef = useRef<HTMLButtonElement>(null);
  const noteBtnRef = useRef<HTMLButtonElement>(null);
  const linkBtnRef = useRef<HTMLButtonElement>(null);

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
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const syncLock = useRef<"" | "l" | "r">("");
  const progL = useRef(false);
  const progR = useRef(false);

  /* ---------- Split-view scroll sync (wrap-accurate, both directions) ---------- */
  const lineMapRef = useRef<HTMLDivElement | null>(null);
  const lineTopsRef = useRef<number[]>([0]);

  const buildLineMap = useCallback(() => {
    const el = bodyRef.current;
    if (!el) return;
    let m = lineMapRef.current;
    if (!m) {
      m = document.createElement("div");
      m.style.position = "absolute";
      m.style.top = "-99999px";
      m.style.left = "0";
      m.style.visibility = "hidden";
      m.style.pointerEvents = "none";
      document.body.appendChild(m);
      lineMapRef.current = m;
    }
    const cs = window.getComputedStyle(el);
    m.style.width = `${el.clientWidth}px`;
    m.style.font = cs.font;
    m.style.lineHeight = cs.lineHeight;
    m.style.letterSpacing = cs.letterSpacing;
    m.style.padding = cs.padding;
    m.style.border = cs.border;
    m.style.boxSizing = cs.boxSizing;
    m.style.wordBreak = "break-word";
    m.style.whiteSpace = "pre-wrap";
    const lines = el.value.split("\n");
    m.textContent = "";
    const frag = document.createDocumentFragment();
    for (const ln of lines) {
      const d = document.createElement("div");
      d.textContent = ln.length ? ln : "\u00a0";
      frag.appendChild(d);
    }
    m.appendChild(frag);
    const tops: number[] = [];
    for (const child of Array.from(m.children)) {
      tops.push((child as HTMLElement).offsetTop);
    }
    lineTopsRef.current = tops.length ? tops : [0];
  }, []);

  useEffect(() => {
    const t = setTimeout(buildLineMap, 120);
    return () => clearTimeout(t);
  }, [content, buildLineMap]);

  useEffect(() => {
    window.addEventListener("resize", buildLineMap);
    return () => window.removeEventListener("resize", buildLineMap);
  }, [buildLineMap]);

  const lineAtVisual = (px: number): number => {
    const tops = lineTopsRef.current;
    let lo = 0;
    let hi = tops.length - 1;
    let ans = 0;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const tv = tops[mid] ?? 0;
      if (tv <= px) {
        ans = mid;
        lo = mid + 1;
      } else hi = mid - 1;
    }
    return ans;
  };

  const visualTopOf = (line: number): number => {
    const tops = lineTopsRef.current;
    return tops[Math.max(0, Math.min(line, tops.length - 1))] ?? 0;
  };

  const alignPreviewToLine = (topLine: number) => {
    const R = rightScrollRef.current;
    if (!R) return;
    const blocks = Array.from(R.querySelectorAll("[data-line]")) as HTMLElement[];
    let target: HTMLElement | null = null;
    for (const b of blocks) {
      const ln = parseInt(b.dataset.line ?? "0", 10);
      if (ln <= topLine) target = b;
      else break;
    }
    if (target) {
      progR.current = true;
      R.scrollTop = Math.max(0, target.offsetTop - 12);
    }
  };

  const alignEditorToPreview = () => {
    const R = rightScrollRef.current;
    const L = leftScrollRef.current;
    if (!R || !L) return;
    const blocks = Array.from(R.querySelectorAll("[data-line]")) as HTMLElement[];
    let line = 0;
    for (const b of blocks) {
      if (b.offsetTop <= R.scrollTop + 16)
        line = parseInt(b.dataset.line ?? "0", 10);
      else break;
    }
    const ta = bodyRef.current;
    const taTop = ta?.offsetTop ?? 60;
    progL.current = true;
    L.scrollTop = Math.max(0, taTop + visualTopOf(line) - 70);
  };

  const syncScroll = (src: "l" | "r") => {
    const L = leftScrollRef.current;
    const R = rightScrollRef.current;
    if (!L || !R) return;
    // ignore scroll events caused by our own programmatic alignment
    if (src === "l" && progL.current) {
      progL.current = false;
      return;
    }
    if (src === "r" && progR.current) {
      progR.current = false;
      return;
    }
    if (syncLock.current && syncLock.current !== src) return;
    syncLock.current = src;
    if (src === "l") {
      const ta = bodyRef.current;
      const taTop = ta?.offsetTop ?? 60;
      alignPreviewToLine(lineAtVisual(Math.max(0, L.scrollTop + 24 - taTop)));
    } else {
      alignEditorToPreview();
    }
    window.setTimeout(() => {
      if (syncLock.current === src) syncLock.current = "";
    }, 220);
  };

  /* ---------- Click a preview block -> caret + scroll on that source line ---------- */
  const jumpToLine = (line: number) => {
    if (viewMode === "view") setViewMode("edit");
    const ls = content.split("\n");
    let idx = 0;
    for (let n = 0; n < line && n < ls.length; n++) idx += (ls[n]?.length ?? 0) + 1;
    window.setTimeout(() => {
      const t = bodyRef.current;
      if (!t) return;
      t.focus({ preventScroll: true });
      t.setSelectionRange(idx, idx);
    }, 40);
    const target = Math.max(
      0,
      (bodyRef.current?.offsetTop ?? 60) + visualTopOf(line) - 90
    );
    const L = leftScrollRef.current;
    if (L && viewMode === "split") {
      progL.current = true;
      L.scrollTop = target;
      alignPreviewToLine(line);
    } else {
      const t = bodyRef.current;
      let p: HTMLElement | null = t?.parentElement ?? null;
      while (p && p.scrollHeight <= p.clientHeight + 4) p = p.parentElement;
      if (p && t) p.scrollTop = t.offsetTop + target - 120;
    }
  };
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
  }, [content, resizeBody, viewMode]);

  /* ---------- Selection position → floating toolbar ---------- */
  const updateSelRect = useCallback(() => {
    const el = bodyRef.current;
    if (!el || document.activeElement !== el) {
      setSelRect(null);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    if (start === end) {
      setSelRect(null);
      return;
    }
    let m = mirrorRef.current;
    if (!m) {
      m = document.createElement("div");
      m.style.position = "absolute";
      m.style.top = "0";
      m.style.left = "0";
      m.style.visibility = "hidden";
      m.style.zIndex = "-1";
      document.body.appendChild(m);
      mirrorRef.current = m;
    }
    const cs = window.getComputedStyle(el);
    m.style.width = `${el.clientWidth}px`;
    m.style.font = cs.font;
    m.style.lineHeight = cs.lineHeight;
    m.style.letterSpacing = cs.letterSpacing;
    m.style.padding = cs.padding;
    m.style.border = cs.border;
    m.style.boxSizing = cs.boxSizing;
    m.style.whiteSpace = "pre-wrap";
    m.style.wordBreak = "break-word";
    m.textContent = el.value.slice(0, end);
    const marker = document.createElement("span");
    marker.textContent = el.value.slice(start, end) || ".";
    m.appendChild(marker);
    const mBase = m.getBoundingClientRect();
    const kRect = marker.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const top = elRect.top + (kRect.top - mBase.top) - 46;
    const left = Math.min(
      Math.max(elRect.left + (kRect.left - mBase.left) + kRect.width / 2, 90),
      window.innerWidth - 90
    );
    setSelRect({ top, left });
  }, []);

  useEffect(() => {
    const hide = () => updateSelRect();
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
  }, [updateSelRect]);

  const applyLink = (url: string) => {
    const el = bodyRef.current;
    if (!el) return;
    const s = el.selectionStart;
    const e = el.selectionEnd;
    const label = content.slice(s, e) || "link text";
    const snippet = `[${label}](${url})`;
    setContent(content.slice(0, s) + snippet + content.slice(e));
    setSelRect(null);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + 1, s + 1 + label.length);
    });
  };

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
      <div className={cn("mx-auto w-full px-6 pb-12 pt-6 sm:px-8", viewMode === "split" ? "max-w-none lg:px-10" : "max-w-2xl md:max-w-3xl")}>
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.push("/notes")}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Back to notes"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="hidden min-w-[100px] justify-start sm:flex">
              <SaveIndicator status={saveStatus} onRetry={() => doSave(title, content)} />
            </div>
            <div
              className="flex items-center rounded-full border border-border bg-card p-0.5"
              role="group"
              aria-label="Editor view mode"
            >
              {(
                [
                  { id: "edit", label: "Write", icon: PencilLine },
                  ...(isDesktop
                    ? [{ id: "split", label: "Split", icon: Columns2 }]
                    : []),
                  { id: "view", label: "Read", icon: Eye },
                ] as { id: "edit" | "split" | "view"; label: string; icon: React.ComponentType<{ className?: string }> }[]
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setViewMode(m.id)}
                  className={cn(
                    "flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold transition-colors",
                    viewMode === m.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-pressed={viewMode === m.id}
                >
                  <m.icon className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">{m.label}</span>
                </button>
              ))}
            </div>
            <div className="flex sm:hidden">
              <SaveIndicator status={saveStatus} onRetry={() => doSave(title, content)} />
            </div>
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
        {viewMode !== "view" && (
          <div className="sticky top-0 z-20 -mx-2 bg-background/95 px-2 pt-2 backdrop-blur">
          <div className="flex items-center gap-0.5 overflow-x-auto border-b border-border/60 pb-2">
            <button type="button" className={toolBtn} title="Bold (⌘B)" onClick={() => { wrapSelection("**", "**"); }}>
              <Bold className="h-3.5 w-3.5" />
            </button>
            <button type="button" className={toolBtn} title="Italic (⌘I)" onClick={() => wrapSelection("*", "*")}>
              <Italic className="h-3.5 w-3.5" />
            </button>
            <button type="button" className={toolBtn} title="Strikethrough" onClick={() => wrapSelection("~~", "~~")}>
              <Strikethrough className="h-3.5 w-3.5" />
            </button>
            <button type="button" className={toolBtn} title="Code" onClick={() => wrapSelection("`", "`")}>
              <Code className="h-3.5 w-3.5" />
            </button>
            <div className="mx-1 h-4 w-px shrink-0 bg-border" />
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
            <button type="button" className={toolBtn} title="Quote" onClick={() => applyLinePrefix("> ", /^>\s/)}>
              <Quote className="h-3.5 w-3.5" />
            </button>
            <button type="button" className={toolBtn} title="Horizontal rule" onClick={() => insertAtCursor("\n\n---\n\n")}>
              <Minus className="h-3.5 w-3.5" />
            </button>
            <div className="mx-1 h-4 w-px shrink-0 bg-border" />
            <button
              ref={linkBtnRef}
              type="button"
              className={cn(toolBtn, linkOpen && "bg-accent text-foreground")}
              title="Link"
              onClick={() => {
                setLinkOpen((v) => !v);
                setColorPanel("none");
                setNotePickerOpen(false);
              }}
            >
              <Link2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className={toolBtn}
              title="Add image (or drag & drop)"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ImagePlus className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              ref={noteBtnRef}
              type="button"
              className={cn(toolBtn, notePickerOpen && "bg-accent text-foreground")}
              title="Insert note"
              onClick={() => {
                setNotePickerOpen((v) => !v);
                setColorPanel("none");
                setLinkOpen(false);
              }}
            >
              <FileText className="h-3.5 w-3.5" />
            </button>
            <button
              ref={hlBtnRef}
              type="button"
              className={cn(toolBtn, colorPanel === "highlight" && "bg-accent text-foreground")}
              title="Highlight"
              onClick={() => {
                setColorPanel((v) => (v === "highlight" ? "none" : "highlight"));
                setNotePickerOpen(false);
                setLinkOpen(false);
              }}
            >
              <Highlighter className="h-3.5 w-3.5" />
            </button>
            <button
              ref={paletteBtnRef}
              type="button"
              className={cn(toolBtn, colorPanel === "text" && "bg-accent text-foreground")}
              title="Text color"
              onClick={() => {
                setColorPanel((v) => (v === "text" ? "none" : "text"));
                setNotePickerOpen(false);
                setLinkOpen(false);
              }}
            >
              <Palette className="h-3.5 w-3.5" />
            </button>
          </div>
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

      {/* Link popover */}
      <AnchoredPopover
        anchorRef={linkBtnRef}
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
      >
        <div className="w-64 p-2">
          <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Insert link
          </p>
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              placeholder="https://…"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && linkUrl.trim()) {
                  applyLink(linkUrl.trim());
                  setLinkUrl("");
                  setLinkOpen(false);
                }
              }}
              className="h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-xs outline-none focus:border-primary"
            />
            <button
              type="button"
              disabled={!linkUrl.trim()}
              onClick={() => {
                applyLink(linkUrl.trim());
                setLinkUrl("");
                setLinkOpen(false);
              }}
              className="h-8 rounded-md bg-primary px-2.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
            >
              Add
            </button>
          </div>
          <p className="mt-1.5 px-1 text-[11px] text-muted-foreground">
            Selected text becomes the link label.
          </p>
        </div>
      </AnchoredPopover>

      {/* Color swatches popover */}
      <AnchoredPopover
        anchorRef={colorPanel === "highlight" ? hlBtnRef : paletteBtnRef}
        open={colorPanel !== "none"}
        onClose={() => setColorPanel("none")}
      >
        <div className="flex items-center gap-2 p-2.5">
          {(colorPanel === "highlight" ? HIGHLIGHT_COLORS : TEXT_COLORS).map((c) => (
            <button
              key={c}
              type="button"
              aria-label={colorPanel === "highlight" ? `Highlight ${c}` : `Text color ${c}`}
              onClick={() => {
                if (colorPanel === "none") return;
                wrapColor(colorPanel, c);
              }}
              className="h-6 w-6 rounded-full border border-border transition-transform hover:scale-110"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </AnchoredPopover>

      {/* Insert-note picker popover */}
      <AnchoredPopover
        anchorRef={noteBtnRef}
        open={notePickerOpen}
        onClose={() => setNotePickerOpen(false)}
      >
        <div className="w-72 p-2">
          <input
            autoFocus
            value={notePickerSearch}
            onChange={(e) => setNotePickerSearch(e.target.value)}
            placeholder="Search notes…"
            className="mb-2 h-8 w-full rounded-md border border-input bg-background px-2 text-sm outline-none"
          />
          <div className="max-h-48 overflow-y-auto">
            {pickerNotes.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => {
                  insertAtCursor(`[[${n.title || "Untitled"}]]`);
                  setNotePickerOpen(false);
                  setNotePickerSearch("");
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-accent"
              >
                <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{n.title || "Untitled"}</span>
              </button>
            ))}
            {pickerNotes.length === 0 && (
              <p className="px-2 py-1.5 text-xs text-muted-foreground">
                No matching notes
              </p>
            )}
          </div>
          <p className="mt-1.5 border-t border-border/60 px-1 pt-1.5 text-[11px] text-muted-foreground">
            Link: [[Title]] · Full embed (own line): ![[Title]]
          </p>
        </div>
      </AnchoredPopover>

      {/* Writing surface / preview (same container so the sticky toolbar can pin) */}
        {viewMode === "view" ? (
          <div className="min-w-0">
            <h1 className="w-full text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {title || "Untitled"}
            </h1>
            <div className="mt-4">
              <MarkdownPreview text={previewContent} onLineClick={jumpToLine} />
            </div>
          </div>
        ) : viewMode === "split" ? (
          <div className="gap-12 md:grid md:grid-cols-2">
            {/* live editor — desktop only, own scroller for sync */}
            <div
              ref={leftScrollRef}
              onScroll={() => syncScroll("l")}
              className="relative hidden md:block md:max-h-[calc(100dvh-230px)] md:overflow-y-auto md:pr-4"
            >
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Untitled"
                className="w-full resize-none border-none bg-transparent text-2xl font-bold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/25 sm:text-3xl"
                spellCheck={false}
              />
              <textarea
                ref={bodyRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleBodyKeyDown}
                onPaste={handlePaste}
                onSelect={updateSelRect}
                onBlur={(e) => {
                  const rt = e.relatedTarget as HTMLElement | null;
                  if (rt?.closest("[data-sel-toolbar]")) return;
                  setSelRect(null);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  const f = Array.from(e.dataTransfer.files).find((x) =>
                    x.type.startsWith("image/")
                  );
                  if (f) void uploadImage(f);
                }}
                placeholder="Start writing…"
                className={cn(
                  "mt-4 w-full resize-none overflow-hidden border-none bg-transparent text-[17px] leading-[1.75] text-foreground outline-none placeholder:text-muted-foreground/25",
                  dragging && "rounded-xl ring-2 ring-primary/40"
                )}
                spellCheck={false}
                rows={1}
              />
            </div>
            {/* preview column — own scroller, synced with editor */}
            <div
              ref={rightScrollRef}
              onScroll={() => syncScroll("r")}
              className="relative min-w-0 md:max-h-[calc(100dvh-230px)] md:overflow-y-auto md:pr-2"
            >
              <h1 className="w-full text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {title || "Untitled"}
              </h1>
              <div className="mt-4">
                <MarkdownPreview text={previewContent} onLineClick={jumpToLine} />
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
              className="w-full resize-none border-none bg-transparent text-2xl font-bold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/25 sm:text-3xl"
              spellCheck={false}
            />
            <textarea
              ref={bodyRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleBodyKeyDown}
              onPaste={handlePaste}
              onSelect={updateSelRect}
              onBlur={(e) => {
                  const rt = e.relatedTarget as HTMLElement | null;
                  if (rt?.closest("[data-sel-toolbar]")) return;
                  setSelRect(null);
                }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const f = Array.from(e.dataTransfer.files).find((x) =>
                  x.type.startsWith("image/")
                );
                if (f) void uploadImage(f);
              }}
              placeholder="Start writing…  ( - list, - [ ] checklist, # heading )"
              className={cn(
                "mt-4 w-full resize-none overflow-hidden border-none bg-transparent text-[17px] leading-[1.75] text-foreground outline-none placeholder:text-muted-foreground/25",
                dragging && "rounded-xl ring-2 ring-primary/40"
              )}
              spellCheck={false}
              rows={1}
            />
          </>
        )}

        {/* Bottom meta */}
        {(wordCount > 0 || charCount > 0) && (
          <div className="mt-8 text-right text-[11px] text-muted-foreground/50">
            {wordCount} {wordCount === 1 ? "word" : "words"}
            {charCount > 0 && <> · {charCount} chars</>}
            {wordCount > 0 && <> · ~{readMins} min read</>}
          </div>
        )}
      </div>

      {/* Floating selection toolbar */}
      {selRect && viewMode !== "view" && (
        <SelectionToolbar
          rect={selRect}
          onBold={() => wrapSelection("**", "**")}
          onItalic={() => wrapSelection("*", "*")}
          onStrike={() => wrapSelection("~~", "~~")}
          onHighlight={() => wrapColor("highlight", "#FEF08A")}
          onLink={(url) => applyLink(url)}
        />
      )}
    </div>
  );
}
