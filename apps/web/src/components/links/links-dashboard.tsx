"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Link2,
  Copy,
  ExternalLink,
  Pin,
  Pencil,
  Trash2,
  MoreVertical,
  Download,
  Folder,
  Tag,
  BarChart3,
  Layers,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCreateLink,
  useDeleteLink,
  useLinks,
  useMoveLink,
  useTogglePinLink,
} from "@/hooks/use-links";
import { useCreateFolder, useTypeFolders } from "@/hooks/use-folder";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LinksPageSkeleton } from "@/components/shared/skeletons/page-skeleton";
import { EditLinkDialog } from "./edit-link-dialog";
import type { Link } from "@repo/contracts/types";

/* ---------- helpers ---------- */
const DAY = 86400000;

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function hueOf(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function Favicon({ link }: { link: Link }) {
  const [broken, setBroken] = useState(false);
  const host = hostOf(link.url);
  if (link.favicon && !broken) {
    return (
      <img
        src={link.favicon}
        alt=""
        onError={() => setBroken(true)}
        className="h-9 w-9 rounded-lg border border-border bg-accent object-contain p-1.5"
      />
    );
  }
  const hue = hueOf(host);
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold uppercase"
      style={{
        background: `hsl(${hue} 70% 50% / 0.15)`,
        color: `hsl(${hue} 80% 60%)`,
      }}
    >
      {(link.title ?? host).charAt(0)}
    </div>
  );
}

/* ---------- main ---------- */
export function LinksDashboard() {
  /* list controls */
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"new" | "old" | "az">("new");
  const [chip, setChip] = useState<string>("all");
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [editing, setEditing] = useState<Link | null>(null);
  const [showNewColl, setShowNewColl] = useState(false);
  const [newCollName, setNewCollName] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  const {
    data: links = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useLinks();
  const { data: folders = [] } = useTypeFolders("link");

  const createM = useCreateLink();
  const deleteM = useDeleteLink();
  const pinM = useTogglePinLink();
  const moveM = useMoveLink();
  const createFolderM = useCreateFolder();

  /* Share Target: login ke baad pending shared link save karo */
  useEffect(() => {
    const pending = localStorage.getItem("stash_pending_share");
    if (!pending) return;
    localStorage.removeItem("stash_pending_share");
    try {
      const { url: u, title: t } = JSON.parse(pending) as {
        url?: string;
        title?: string;
      };
      if (u) {
        createM.mutate(
          { url: u, title: t || undefined, description: undefined },
          { onSuccess: () => toast.success("Shared link saved!") }
        );
      }
    } catch {
      // ignore malformed pending share
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* close kebab on outside click */
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

  function createCollection() {
    const name = newCollName.trim();
    if (!name) return;
    createFolderM.mutate(
      { name, icon: "📁", type: "link" },
      {
        onSuccess: () => {
          setShowNewColl(false);
          setNewCollName("");
          toast.success("Collection created!");
        },
        onError: (er: any) => toast.error(er?.message || "Failed to create collection"),
      }
    );
  }

  /* ---------- stats ---------- */
  const stats = useMemo(() => {
    const now = Date.now();
    const added7 = links.filter((l) => now - +new Date(l.createdAt) < 7 * DAY);
    const prev7 = links.filter((l) => {
      const age = now - +new Date(l.createdAt);
      return age >= 7 * DAY && age < 14 * DAY;
    });
    const tagCount = new Map<string, number>();
    for (const l of links) for (const t of l.tags) tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
    return {
      total: links.length,
      added7: added7.length,
      prev7: prev7.length,
      collections: folders.length,
      tags: tagCount.size,
      topTag: [...tagCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0],
      tagCount,
    };
  }, [links, folders]);

  /* ---------- chart: last 7 days ---------- */
  const days = useMemo(() => {
    const out: { label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const next = +d + DAY;
      out.push({
        label: d.toLocaleDateString(undefined, { weekday: "narrow" }),
        count: links.filter((l) => {
          const t = +new Date(l.createdAt);
          return t >= +d && t < next;
        }).length,
      });
    }
    return out;
  }, [links]);
  const maxDay = Math.max(1, ...days.map((d) => d.count));

  /* ---------- top collections ---------- */
  const topCollections = useMemo(() => {
    const rows = folders.map((f) => ({
      id: f.id,
      name: `${f.icon} ${f.name}`,
      count: links.filter((l) => l.folderId === f.id).length,
    }));
    const ungrouped = links.filter((l) => !l.folderId).length;
    if (ungrouped > 0) rows.push({ id: "ungrouped", name: "Ungrouped", count: ungrouped });
    return rows.sort((a, b) => b.count - a.count).slice(0, 4);
  }, [folders, links]);
  const maxColl = Math.max(1, ...topCollections.map((c) => c.count));

  const topTags = useMemo(
    () => [...stats.tagCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8),
    [stats]
  );

  /* ---------- filtered + sorted list ---------- */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = links.filter((l) => {
      const matchQ =
        !q ||
        (l.title ?? "").toLowerCase().includes(q) ||
        (l.description ?? "").toLowerCase().includes(q) ||
        l.url.toLowerCase().includes(q) ||
        l.tags.some((t) => t.toLowerCase().includes(q));
      const matchC =
        chip === "all" ? true : chip === "ungrouped" ? !l.folderId : l.folderId === chip;
      return matchQ && matchC;
    });
    return list.sort((a, b) =>
      sort === "new"
        ? +new Date(b.createdAt) - +new Date(a.createdAt)
        : sort === "old"
          ? +new Date(a.createdAt) - +new Date(b.createdAt)
          : (a.title ?? a.url).localeCompare(b.title ?? b.url)
    );
  }, [links, search, chip, sort]);

  /* ---------- actions ---------- */
  function copyText(text: string) {
    navigator.clipboard?.writeText(text).then(() => toast.success("Copied!"));
  }

  function exportCsv() {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = [
      ["url", "title", "collection", "tags", "created_at"].join(","),
      ...filtered.map((l) =>
        [
          esc(l.url),
          esc(l.title ?? ""),
          esc(folders.find((f) => f.id === l.folderId)?.name ?? ""),
          esc(l.tags.join("; ")),
          esc(new Date(l.createdAt).toISOString()),
        ].join(",")
      ),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "stash-links.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  if (isLoading) return <LinksPageSkeleton />;
  if (isError) {
    return (
      <div className="mx-auto max-w-6xl">
        <ErrorState
          message={(error as Error)?.message ?? "Failed to load links"}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const card = "rounded-2xl border border-border bg-card";

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* ---------- stats ---------- */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { icon: Link2, label: "Total Links", n: stats.total, s: `+${stats.added7} this week` },
          { icon: Folder, label: "Collections", n: stats.collections, s: "organised piles" },
          { icon: Tag, label: "Tags", n: stats.tags, s: stats.topTag ? `most used: ${stats.topTag}` : "no tags yet" },
          { icon: BarChart3, label: "Added · 7d", n: stats.added7, s: `vs prev 7d ${stats.added7 - stats.prev7 >= 0 ? "+" : ""}${stats.added7 - stats.prev7}` },
        ].map((st) => (
          <div key={st.label} className={cn(card, "p-4")}>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-muted-foreground">{st.label}</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <st.icon className="h-3.5 w-3.5 text-primary" />
              </span>
            </div>
            <div className="mt-1.5 text-[26px] font-extrabold leading-none">{st.n}</div>
            <div className="mt-1.5 text-xs text-muted-foreground">{st.s}</div>
          </div>
        ))}
      </div>

      {/* ---------- list + top tags ---------- */}
      <div className="grid gap-3 lg:grid-cols-[1.7fr_1fr]">
        <div className={cn(card, "p-5")}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[13px] font-extrabold tracking-wider">
              YOUR LINKS{" "}
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
              placeholder="Search links…"
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
            {[{ id: "all", name: "All" }, { id: "ungrouped", name: "Ungrouped" }, ...folders].map(
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
                  {"icon" in f ? `${(f as any).icon} ` : ""}
                  {f.name}
                </button>
              )
            )}
            {showNewColl ? (
              <span className="flex items-center gap-1.5">
                <Input
                  autoFocus
                  value={newCollName}
                  onChange={(e) => setNewCollName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      createCollection();
                    }
                    if (e.key === "Escape") setShowNewColl(false);
                  }}
                  placeholder="Collection name"
                  className="h-7 w-32 text-xs"
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={createFolderM.isPending || !newCollName.trim()}
                  onClick={createCollection}
                  className="h-7 px-2.5 text-xs"
                >
                  Save
                </Button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setShowNewColl(true)}
                className="rounded-full border border-dashed border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
              >
                + New
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="py-8">
              <EmptyState
                icon={Layers}
                title="No links here"
                description={search ? `Nothing matches “${search}”.` : "Save a link above to get started."}
              />
            </div>
          ) : (
            <div className="mt-1 divide-y divide-border">
              {filtered.map((link) => {
                const folder = folders.find((f) => f.id === link.folderId);
                return (
                  <div key={link.id} className="relative flex items-center gap-3 py-3">
                    <Favicon link={link} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {link.isPinned && <Pin className="h-3 w-3 shrink-0 fill-primary text-primary" />}
                        <span className="truncate text-sm font-semibold">
                          {link.title ?? hostOf(link.url)}
                        </span>
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        {folder && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
                            {folder.icon} {folder.name}
                          </span>
                        )}
                        {link.tags.slice(0, 2).map((t) => (
                          <span key={t} className="rounded-full bg-accent px-2 py-0.5 text-[11px]">
                            {t}
                          </span>
                        ))}
                        <span className="truncate">
                          {hostOf(link.url)} · {fmtDate(link.createdAt)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setMenuFor(menuFor === link.id ? null : link.id);
                        setConfirmDel(null);
                      }}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                      aria-label="Link menu"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {menuFor === link.id && (
                      <div
                        ref={menuRef}
                        className="absolute right-0 top-11 z-20 w-48 rounded-xl border border-border bg-card p-1 shadow-xl"
                      >
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> Open
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            copyText(link.url);
                            setMenuFor(null);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent"
                        >
                          <Copy className="h-3.5 w-3.5" /> Copy URL
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            pinM.mutate(link.id);
                            setMenuFor(null);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent"
                        >
                          <Pin className="h-3.5 w-3.5" /> {link.isPinned ? "Unpin" : "Pin"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(link);
                            setMenuFor(null);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        {folders.length > 0 && (
                          <div className="mt-1 border-t border-border pt-1">
                            <p className="px-3 py-1 text-[11px] text-muted-foreground">
                              Move to…
                            </p>
                            {folders.map((f) => (
                              <button
                                key={f.id}
                                type="button"
                                onClick={() => {
                                  moveM.mutate({ id: link.id, folderId: f.id });
                                  setMenuFor(null);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] text-muted-foreground hover:bg-accent hover:text-foreground"
                              >
                                <Folder className="h-3 w-3" /> {f.icon} {f.name}
                              </button>
                            ))}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (confirmDel !== link.id) {
                              setConfirmDel(link.id);
                              return;
                            }
                            deleteM.mutate(link.id, {
                              onSuccess: () => toast.success("Link deleted"),
                            });
                            setMenuFor(null);
                          }}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm",
                            confirmDel === link.id
                              ? "bg-destructive text-destructive-foreground"
                              : "text-destructive hover:bg-destructive/10"
                          )}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {confirmDel === link.id ? "Confirm delete?" : "Delete"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className={cn(card, "p-5")}>
          <h2 className="mb-4 text-[13px] font-extrabold tracking-wider">TOP TAGS</h2>
          {topTags.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No tags yet.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {topTags.map(([t, n]) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSearch(t)}
                  className="rounded-full border border-border bg-accent px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <span className="font-semibold text-foreground">{t}</span> · {n}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ---------- top collections + chart ---------- */}
      <div className="grid gap-3 lg:grid-cols-[1fr_1.7fr]">
        <div className={cn(card, "p-5")}>
          <h2 className="mb-4 text-[13px] font-extrabold tracking-wider">
            TOP COLLECTIONS
          </h2>
          {topCollections.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No collections yet.
            </p>
          ) : (
            <div className="space-y-3.5">
              {topCollections.map((c) => (
                <div key={c.id}>
                  <div className="mb-1.5 flex justify-between text-[13px]">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-muted-foreground">{c.count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-accent">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(c.count / maxColl) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className={cn(card, "p-5")}>
          <h2 className="mb-4 text-[13px] font-extrabold tracking-wider">
            LINKS SAVED · LAST 7 DAYS
          </h2>
          {stats.total === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No links saved yet.
            </p>
          ) : (
            <div className="flex h-32 items-end gap-2 sm:gap-3">
              {days.map((d, i) => (
                <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1.5">
                  <div
                    className="w-full max-w-10 rounded-t-md bg-primary/80"
                    style={{ height: `${Math.max(4, Math.round((d.count / maxDay) * 104))}px` }}
                    title={`${d.count} link${d.count === 1 ? "" : "s"}`}
                  />
                  <span className="text-[11px] text-muted-foreground">{d.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <EditLinkDialog
        link={editing}
        isOpen={!!editing}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}