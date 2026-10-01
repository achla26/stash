"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Library,
  BarChart3,
  Star,
  Search,
  Copy,
  Check,
  Pencil,
  Trash2,
  MoreVertical,
  Download,
  X,
  GraduationCap,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCreateWord,
  useDeleteWord,
  useToggleMastered,
  useWords,
} from "@/hooks/use-words";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { WordEditDialog } from "./word-edit-dialog";
import type { Word } from "@repo/contracts/types";

const DAY = 86400000;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function hueOf(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

/* free dictionary API — no key, $0; 5s timeout taaki slow net pe user atka na rahe */
async function fetchMeaning(w: string) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const r = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(w.toLowerCase())}`,
      { signal: ctrl.signal }
    );
    if (!r.ok) return null;
    const j = await r.json();
    const e = Array.isArray(j) ? j[0] : null;
    if (!e) return null;
    const m = e.meanings?.[0];
    const defWithExample = m?.definitions?.find((d: any) => d.example);
    return {
      meaning: m?.definitions?.[0]?.definition ?? "",
      partOfSpeech: m?.partOfSpeech ?? "",
      pronunciation:
        e.phonetic ?? e.phonetics?.find((p: any) => p.text)?.text ?? "",
      example: defWithExample?.example ?? "",
      synonyms: (m?.synonyms ?? []).slice(0, 3),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function WordsDashboard() {
  const [newWord, setNewWord] = useState("");
  const [adding, setAdding] = useState(false);
  const [addErr, setAddErr] = useState("");
  const [lastSaved, setLastSaved] = useState<Word | null>(null);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"new" | "old" | "az">("new");
  const [chip, setChip] = useState<string>("all");
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [editing, setEditing] = useState<Word | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const {
    data: words = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useWords();

  const createM = useCreateWord();
  const deleteM = useDeleteWord();
  const masteredM = useToggleMastered();

  useEffect(() => {
    if (!menuFor) return;
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuFor(null);
        setConfirmDel(null);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuFor]);

  /* ---------- stats ---------- */
  const stats = useMemo(() => {
    const now = Date.now();
    const added7 = words.filter((w) => now - +new Date(w.createdAt) < 7 * DAY);
    const prev7 = words.filter((w) => {
      const age = now - +new Date(w.createdAt);
      return age >= 7 * DAY && age < 14 * DAY;
    });
    const bookCount = new Map<string, number>();
    for (const w of words)
      if (w.book) bookCount.set(w.book, (bookCount.get(w.book) ?? 0) + 1);
    const top = [...bookCount.entries()].sort((a, b) => b[1] - a[1]);
    const topMax = top[0]?.[1] ?? 1;
    return {
      topMax,
      total: words.length,
      added7: added7.length,
      prev7: prev7.length,
      books: bookCount.size,
      mastered: words.filter((w) => w.mastered).length,
      top,
    };
  }, [words]);

  const days = useMemo(() => {
    const out: { label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const next = +d + DAY;
      out.push({
        label: d.toLocaleDateString(undefined, { weekday: "narrow" }),
        count: words.filter((w) => {
          const t = +new Date(w.createdAt);
          return t >= +d && t < next;
        }).length,
      });
    }
    return out;
  }, [words]);
  const maxDay = Math.max(1, ...days.map((d) => d.count));

  /* ---------- filtered ---------- */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = words.filter((w) => {
      const matchQ =
        !q ||
        w.word.toLowerCase().includes(q) ||
        (w.meaning ?? "").toLowerCase().includes(q) ||
        (w.book ?? "").toLowerCase().includes(q) ||
        (w.note ?? "").toLowerCase().includes(q);
      const matchC =
        chip === "all"
          ? true
          : chip === "nobook"
            ? !w.book
            : w.book === chip;
      return matchQ && matchC;
    });
    return list.sort((a, b) =>
      sort === "new"
        ? +new Date(b.createdAt) - +new Date(a.createdAt)
        : sort === "old"
          ? +new Date(a.createdAt) - +new Date(b.createdAt)
          : a.word.localeCompare(b.word)
    );
  }, [words, search, chip, sort]);

  /* ---------- add word: search + auto-save ---------- */
  async function addWord(e: React.FormEvent) {
    e.preventDefault();
    const w = newWord.trim();
    if (!w) return;
    setAddErr("");
    setAdding(true);
    const dup = words.find((x) => x.word.toLowerCase() === w.toLowerCase());
    if (dup) {
      setAdding(false);
      setAddErr(`“${dup.word}” already saved hai — Edit se update karo.`);
      return;
    }
    const m = await fetchMeaning(w);
    createM.mutate(
      {
        word: w,
        meaning: m?.meaning ?? "",
        pronunciation: m?.pronunciation ?? "",
        partOfSpeech: m?.partOfSpeech ?? "",
        example: m?.example ?? "",
        synonyms: m?.synonyms ?? [],
      },
      {
        onSuccess: (saved) => {
          setLastSaved(saved);
          setNewWord("");
          setAdding(false);
          if (!m) toast.info("Meaning nahi mili — Edit se add karo");
        },
        onError: (er: any) => {
          setAdding(false);
          setAddErr(er?.message || "Save failed");
        },
      }
    );
  }

  function copyText(text: string) {
    navigator.clipboard?.writeText(text).then(() => toast.success("Copied!"));
  }

  function exportCsv() {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = [
      ["word", "meaning", "book", "page", "mastered", "created_at"].join(","),
      ...filtered.map((w) =>
        [
          esc(w.word),
          esc(w.meaning),
          esc(w.book ?? ""),
          esc(w.page != null ? String(w.page) : ""),
          w.mastered ? "yes" : "no",
          esc(new Date(w.createdAt).toISOString()),
        ].join(",")
      ),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "stash-words.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="h-32 animate-pulse rounded-2xl border border-border bg-card" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-border bg-card" />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-2xl border border-border bg-card" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-6xl">
        <ErrorState
          message={(error as Error)?.message ?? "Failed to load words"}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const card = "rounded-2xl border border-border bg-card";

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* ---------- add word ---------- */}
      <form onSubmit={addWord} className={cn(card, "p-5 sm:p-6")}>
        <h1 className="flex items-center gap-2.5 text-lg font-extrabold tracking-wide sm:text-xl">
          <BookOpen className="h-5 w-5 text-primary" /> ADD A WORD
        </h1>
        <p className="mb-4 mt-1 text-[13px] text-muted-foreground">
          Word likho — meaning auto-fetch hoke save ho jayegi. Details baad me Edit se.
        </p>
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <Input
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            placeholder="Word — e.g. serendipity"
            className="h-11 flex-1"
          />
          <Button type="submit" disabled={adding || !newWord.trim()} className="h-11 px-6">
            {adding ? (
              "Searching…"
            ) : (
              <>
                <Search className="h-4 w-4" /> Add word
              </>
            )}
          </Button>
        </div>
        {addErr && <p className="mt-2 text-xs text-destructive">{addErr}</p>}
        {lastSaved && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
            <div className="min-w-0">
              <span className="text-sm font-bold text-emerald-500">{lastSaved.word}</span>
              <div className="truncate text-xs text-muted-foreground">
                {lastSaved.meaning || "meaning nahi mili — Edit se add karo"}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <Button
                type="button"
                size="sm"
                onClick={() => copyText(`${lastSaved.word}: ${lastSaved.meaning}`)}
                className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
              >
                <Copy className="h-3.5 w-3.5" /> Copy
              </Button>
              <button
                type="button"
                onClick={() => setLastSaved(null)}
                className="rounded p-1 text-muted-foreground hover:text-foreground"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </form>

      {/* ---------- stats ---------- */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { icon: BookOpen, label: "Total Words", n: stats.total, s: `+${stats.added7} this week` },
          { icon: Library, label: "Books", n: stats.books, s: stats.top[0] ? `top: ${stats.top[0][0]}` : "no books yet" },
          { icon: BarChart3, label: "Added · 7d", n: stats.added7, s: `vs prev 7d ${stats.added7 - stats.prev7 >= 0 ? "+" : ""}${stats.added7 - stats.prev7}` },
          { icon: GraduationCap, label: "Mastered", n: stats.mastered, s: "keep going!" },
        ].map((st) => (
          <div key={st.label} className={cn(card, "p-4")}>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-muted-foreground">{st.label}</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <st.icon className="h-3.5 w-3.5 text-primary" />
              </span>
            </div>
            <div className="mt-1.5 text-[26px] font-extrabold leading-none">{st.n}</div>
            <div className="mt-1.5 truncate text-xs text-muted-foreground">{st.s}</div>
          </div>
        ))}
      </div>

      {/* ---------- chart + top books ---------- */}
      <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr]">
        <div className={cn(card, "p-5")}>
          <h2 className="mb-4 text-[13px] font-extrabold tracking-wider">
            WORDS SAVED · LAST 7 DAYS
          </h2>
          {stats.total === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No words saved yet.
            </p>
          ) : (
            <div className="flex h-32 items-end gap-2 sm:gap-3">
              {days.map((d, i) => (
                <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1.5">
                  <div
                    className="w-full max-w-10 rounded-t-md bg-primary/80"
                    style={{ height: `${Math.max(4, Math.round((d.count / maxDay) * 104))}px` }}
                    title={`${d.count}`}
                  />
                  <span className="text-[11px] text-muted-foreground">{d.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className={cn(card, "p-5")}>
          <h2 className="mb-4 text-[13px] font-extrabold tracking-wider">TOP BOOKS</h2>
          {stats.top.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No books yet — Edit me book add karo.
            </p>
          ) : (
            <div className="space-y-3.5">
              {stats.top.slice(0, 4).map(([name, count]) => (
                <div key={name}>
                  <div className="mb-1.5 flex justify-between text-[13px]">
                    <span className="truncate font-medium">{name}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-accent">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(count / stats.topMax) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ---------- words list ---------- */}
      <div className={cn(card, "p-5")}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[13px] font-extrabold tracking-wider">
            YOUR WORDS{" "}
            <span className="ml-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {filtered.length}
            </span>
          </h2>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search words or meanings…"
            className="h-9 flex-1"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="h-9 rounded-md border border-input bg-background px-2.5 text-sm outline-none"
          >
            <option value="new">Newest first</option>
            <option value="old">Oldest first</option>
            <option value="az">A–Z</option>
          </select>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {[{ id: "all", name: "All" }, { id: "nobook", name: "No book" }, ...stats.top.map(([b]) => ({ id: b, name: b }))].map(
            (f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setChip(f.id)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs",
                  chip === f.id
                    ? "bg-primary/10 font-medium text-primary ring-1 ring-primary/40"
                    : "bg-accent text-muted-foreground hover:text-foreground"
                )}
              >
                {f.name}
              </button>
            )
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="py-8">
            <EmptyState
              icon={BookOpen}
              title="No words here"
              description={search ? `Nothing matches “${search}”.` : "Upar se pehla word add karo."}
            />
          </div>
        ) : (
          <div className="mt-1 divide-y divide-border">
            {filtered.map((w) => {
              const hue = hueOf(w.word);
              return (
                <div key={w.id} className="relative flex items-start gap-3 py-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-base font-extrabold uppercase"
                    style={{
                      background: `hsl(${hue} 70% 50% / 0.15)`,
                      color: `hsl(${hue} 80% 60%)`,
                    }}
                  >
                    {w.word.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="text-sm font-bold">{w.word}</span>
                      {w.pronunciation && (
                        <span className="text-xs italic text-muted-foreground">{w.pronunciation}</span>
                      )}
                      {w.partOfSpeech && (
                        <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] text-muted-foreground">
                          {w.partOfSpeech}
                        </span>
                      )}
                      {w.mastered && (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-500">
                          <Check className="h-2.5 w-2.5" /> mastered
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 truncate text-[13px] text-muted-foreground">
                      {w.meaning || "meaning nahi hai — Edit se add karo"}
                    </div>
                    {w.note && (
                      <div className="mt-0.5 truncate text-xs text-muted-foreground/80">
                        Note: {w.note}
                      </div>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      {w.book && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
                          {w.book}
                          {w.page ? ` · p.${w.page}` : ""}
                        </span>
                      )}
                      <span>{fmtDate(w.createdAt)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuFor(menuFor === w.id ? null : w.id);
                      setConfirmDel(null);
                    }}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                    aria-label="Word menu"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  {menuFor === w.id && (
                    <div
                      ref={menuRef}
                      className="absolute right-0 top-11 z-20 w-48 rounded-xl border border-border bg-card p-1 shadow-xl"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(w);
                          setMenuFor(null);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit details
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          copyText(`${w.word}: ${w.meaning}`);
                          setMenuFor(null);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent"
                      >
                        <Copy className="h-3.5 w-3.5" /> Copy
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          masteredM.mutate(w.id);
                          setMenuFor(null);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent"
                      >
                        <GraduationCap className="h-3.5 w-3.5" />
                        {w.mastered ? "Unmark mastered" : "Mark mastered"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirmDel !== w.id) {
                            setConfirmDel(w.id);
                            return;
                          }
                          deleteM.mutate(w.id, {
                            onSuccess: () => toast.success("Word deleted"),
                          });
                          setMenuFor(null);
                        }}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm",
                          confirmDel === w.id
                            ? "bg-destructive text-destructive-foreground"
                            : "text-destructive hover:bg-destructive/10"
                        )}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {confirmDel === w.id ? "Confirm delete?" : "Delete"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <WordEditDialog
        word={editing}
        isOpen={!!editing}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}
