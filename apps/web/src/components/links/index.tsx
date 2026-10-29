"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Folder, Grid2X2, Inbox, Layers, Link2, List, Pencil, Pin, Plus, Search, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useLinks, useCreateLink, useDeleteLink, useTogglePinLink } from "@/hooks/use-links";
import { useTypeFolders } from "@/hooks/use-folder";
import { ErrorState } from "@/components/shared/error-state";
import { LinksPageSkeleton } from "@/components/shared/skeletons/page-skeleton";
import { CreateLinkDialog } from "./create-link-dialog";
import { EditLinkDialog } from "./edit-link-dialog";
import { LinksDashboard } from "./links-dashboard";
import { LinksTrash } from "./links-trash";
import type { Link } from "@repo/contracts/types";

function hostOf(url: string) { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; } }

export function LinksContent() {
  const { data: links = [], isLoading, isError, error, refetch } = useLinks();
  const { data: folders = [] } = useTypeFolders("link");
  const pin = useTogglePinLink(), remove = useDeleteLink(), create = useCreateLink();
  useEffect(() => {
    const pending = localStorage.getItem("stash_pending_share");
    if (!pending) return;
    try {
      const shared = JSON.parse(pending) as { url?: string; title?: string };
      if (!shared.url) { localStorage.removeItem("stash_pending_share"); return; }
      localStorage.removeItem("stash_pending_share");
      create.mutate({ url: shared.url, title: shared.title || undefined, description: undefined }, { onSuccess: () => toast.success("Shared link saved!"), onError: () => { localStorage.setItem("stash_pending_share", pending); toast.error("Could not save shared link. Try again."); } });
    } catch { localStorage.removeItem("stash_pending_share"); }
    // Run once when the Links screen opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [tag, setTag] = useState("");
  const [sort, setSort] = useState("new");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Link | null>(null);
  const [showTrash, setShowTrash] = useState(false);
  const [manage, setManage] = useState(false);
  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    links.forEach(link => link.tags.forEach(t => counts.set(t, (counts.get(t) ?? 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [links]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return links.filter(l => {
      const matchesFilter = filter === "all" || (filter === "pinned" && l.isPinned) || (filter === "ungrouped" && !l.folderId) || l.folderId === filter;
      const matchesSearch = !q || [l.title, l.url, l.description, ...l.tags].some(value => value?.toLowerCase().includes(q));
      return matchesFilter && matchesSearch && (!tag || l.tags.includes(tag));
    }).sort((a, b) => sort === "az" ? (a.title ?? a.url).localeCompare(b.title ?? b.url) : sort === "old" ? +new Date(a.createdAt) - +new Date(b.createdAt) : +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [links, filter, search, tag, sort]);
  if (isLoading) return <LinksPageSkeleton />;
  if (isError) return <div className="mx-auto max-w-[1080px]"><ErrorState message={(error as Error)?.message ?? "Failed to load links"} onRetry={() => refetch()} /></div>;
  if (showTrash) return <div className="mx-auto max-w-[1080px]"><LinksTrash onBack={() => setShowTrash(false)} /></div>;
  if (manage) return <div className="mx-auto max-w-[1080px]"><button onClick={() => setManage(false)} className="proto-link-button mb-4">← Back to links</button><LinksDashboard /></div>;
  const rails = [
    { id: "all", label: "All links", icon: Layers, count: links.length },
    { id: "pinned", label: "Pinned", icon: Pin, count: links.filter(l => l.isPinned).length },
    { id: "ungrouped", label: "Ungrouped", icon: Inbox, count: links.filter(l => !l.folderId).length },
    ...folders.map(f => ({ id: f.id, label: f.name, icon: Folder, count: links.filter(l => l.folderId === f.id).length })),
  ];
  const reset = () => { setSearch(""); setFilter("all"); setTag(""); };
  return <div className="proto-links mx-auto max-w-[1080px]">
    <aside className="proto-links-rail"><div className="proto-links-rail-card">{rails.map(({ id, label, icon: Icon, count }) => <button key={id} onClick={() => { setFilter(id); setTag(""); }} className={filter === id ? "active" : ""}><Icon size={16} /><span className="truncate">{label}</span><small>{count}</small></button>)}<div className="proto-links-tags-title">Tags</div>{tags.length ? tags.map(([name, count]) => <button key={name} className={tag === name ? "tag-active" : ""} onClick={() => setTag(tag === name ? "" : name)}><Tag size={15} /><span className="truncate">{name}</span><small>{count}</small></button>) : <p className="px-2.5 pb-2 text-xs text-muted-foreground">No tags yet</p>}</div></aside>
    <main className="proto-links-main"><div className="proto-links-toolbar"><div className="proto-links-search"><Search size={16} /><label className="sr-only" htmlFor="links-search">Search links</label><input id="links-search" placeholder="Search title, site or tag…" value={search} onChange={e => setSearch(e.target.value)} /></div><label className="sr-only" htmlFor="links-sort">Sort links</label><select id="links-sort" value={sort} onChange={e => setSort(e.target.value)}><option value="new">Newest first</option><option value="old">Oldest first</option><option value="az">A–Z</option></select><div className="proto-links-view" role="group" aria-label="View"><button aria-label="Grid view" aria-pressed={view === "grid"} className={view === "grid" ? "active" : ""} onClick={() => setView("grid")}><Grid2X2 size={16}/></button><button aria-label="List view" aria-pressed={view === "list"} className={view === "list" ? "active" : ""} onClick={() => setView("list")}><List size={16}/></button></div><button className="proto-link-button" onClick={() => setManage(true)}>Manage</button><button className="proto-link-button" onClick={() => setShowTrash(true)}><Trash2 size={15}/> Trash</button><button className="proto-link-button primary" onClick={() => setCreateOpen(true)}><Plus size={16}/> New link</button></div>
      <p className="proto-links-meta">{filtered.length} {filtered.length === 1 ? "link" : "links"}{tag ? ` · #${tag}` : ""}{(tag || search || filter !== "all") && <button onClick={reset}>Clear filters</button>}</p>
      {filtered.length === 0 ? <div className="proto-links-empty"><span><Link2 size={22}/></span><h2>{links.length === 0 ? "No links here yet" : "No links match"}</h2><p>{links.length === 0 ? "Save your first one — paste a URL and Stash fills in the rest." : "Try a different search or filter."}</p><button className="proto-link-button primary" onClick={links.length === 0 ? () => setCreateOpen(true) : reset}>{links.length === 0 ? "Save your first link" : "Clear filters"}</button></div> : <div className={`proto-links-grid ${view === "list" ? "list-view" : ""}`}>{filtered.map(link => {
        const host = hostOf(link.url), folder = folders.find(f => f.id === link.folderId);
        return <article key={link.id} className="proto-link-card"><div className="proto-link-card-top"><span className="proto-link-fav">{(link.title || host).charAt(0).toUpperCase()}</span><span className="min-w-0 flex-1"><span className="proto-link-domain">{host}</span><span className="proto-link-when">{new Date(link.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span></span><div className="proto-link-actions"><button aria-label={link.isPinned ? "Unpin link" : "Pin link"} aria-pressed={link.isPinned} onClick={() => pin.mutate(link.id, { onError: () => toast.error("Could not update pin") })}><Pin size={16} className={link.isPinned ? "text-primary" : ""}/></button><button aria-label="Edit link" onClick={() => setEditing(link)}><Pencil size={16}/></button><button aria-label="Move link to trash" onClick={() => { if (window.confirm("Move this link to trash?")) remove.mutate(link.id, { onSuccess: () => toast.success("Moved to trash"), onError: () => toast.error("Could not move to trash") }); }}><Trash2 size={16}/></button></div></div><div className="proto-link-mid"><a className="proto-link-title" href={link.url} target="_blank" rel="noopener noreferrer">{link.title || host} <ExternalLink size={13} className="inline" /></a>
          {/* {link.description && <p className="proto-link-description">{link.description}</p>} */}
        </div>
        <div className="proto-link-foot">{folder && <span>{folder.name}</span>}{link.tags.map(t => <button key={t} onClick={() => setTag(t)}>#{t}</button>)}</div></article>;
      })}</div>}
    </main><CreateLinkDialog isOpen={createOpen} onClose={() => setCreateOpen(false)} /><EditLinkDialog link={editing} isOpen={!!editing} onClose={() => setEditing(null)} />
  </div>;
}
