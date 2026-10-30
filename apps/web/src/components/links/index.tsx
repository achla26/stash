"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Folder, Grid2X2, Inbox, Layers, Link2, List, Pencil, Pin, Plus, Search, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useLinks, useCreateLink, useDeleteLink, useTogglePinLink } from "@/hooks/use-links";
import { useTypeFolders } from "@/hooks/use-folder";
import { StashEmpty } from "@/components/shared/stash-ui";
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
  if (manage) return <div className="mx-auto max-w-[1080px]"><button onClick={() => setManage(false)} className="mb-4 inline-flex min-h-[38px] items-center justify-center rounded-lg border border-input bg-card px-[13px] py-2 text-[13px] font-bold hover:bg-accent">← Back to links</button><LinksDashboard /></div>;
  const rails = [
    { id: "all", label: "All links", icon: Layers, count: links.length },
    { id: "pinned", label: "Pinned", icon: Pin, count: links.filter(l => l.isPinned).length },
    { id: "ungrouped", label: "Ungrouped", icon: Inbox, count: links.filter(l => !l.folderId).length },
    ...folders.map(f => ({ id: f.id, label: f.name, icon: Folder, count: links.filter(l => l.folderId === f.id).length })),
  ];
  const reset = () => { setSearch(""); setFilter("all"); setTag(""); };
  return <div className="mx-auto flex w-full max-w-[1080px] flex-col items-start gap-4 md:flex-row">
    <aside className="w-full shrink-0 md:sticky md:top-0 md:w-[216px]"><div className="flex flex-wrap gap-[3px] rounded-[10px] border border-border bg-card p-2 md:block [&>button]:flex [&>button]:min-h-10 [&>button]:w-auto [&>button]:items-center [&>button]:gap-[9px] [&>button]:rounded-lg [&>button]:px-2.5 [&>button]:py-[9px] [&>button]:text-left [&>button]:text-[13px] [&>button]:font-semibold [&>button]:text-muted-foreground [&>button:hover]:bg-accent [&>button:hover]:text-foreground md:[&>button]:w-full [&_small]:ml-auto [&_small]:text-[11px]">{rails.map(({ id, label, icon: Icon, count }) => <button key={id} onClick={() => { setFilter(id); setTag(""); }} className={filter === id ? "!bg-foreground !text-background" : ""}><Icon size={16} /><span className="truncate">{label}</span><small>{count}</small></button>)}<div className="mt-2 w-full border-t border-border px-2.5 pb-[5px] pt-3.5 text-[10.5px] font-extrabold uppercase tracking-[.09em] text-muted-foreground">Tags</div>{tags.length ? tags.map(([name, count]) => <button key={name} className={tag === name ? "!bg-primary/10 !text-primary" : ""} onClick={() => setTag(tag === name ? "" : name)}><Tag size={15} /><span className="truncate">{name}</span><small>{count}</small></button>) : <p className="px-2.5 pb-2 text-xs text-muted-foreground">No tags yet</p>}</div></aside>
    <main className="w-full min-w-0 flex-1"><div className="mb-3.5 flex flex-wrap items-center gap-2 [&_select]:min-h-10 [&_select]:rounded-lg [&_select]:border [&_select]:border-input [&_select]:bg-card [&_select]:px-2.5 [&_select]:text-[13px]"><div className="flex min-h-10 min-w-[170px] flex-1 items-center gap-2 rounded-lg border border-input bg-card px-[11px] text-muted-foreground [&_input]:w-full [&_input]:border-0 [&_input]:bg-transparent [&_input]:text-[13.5px] [&_input]:text-foreground [&_input]:outline-none"><Search size={16} /><label className="sr-only" htmlFor="links-search">Search links</label><input id="links-search" placeholder="Search title, site or tag…" value={search} onChange={e => setSearch(e.target.value)} /></div><label className="sr-only" htmlFor="links-sort">Sort links</label><select id="links-sort" value={sort} onChange={e => setSort(e.target.value)}><option value="new">Newest first</option><option value="old">Oldest first</option><option value="az">A–Z</option></select><div className="inline-flex gap-0.5 rounded-lg border border-input bg-card p-[3px] [&_button]:grid [&_button]:h-8 [&_button]:w-9 [&_button]:place-items-center [&_button]:rounded-md [&_button]:text-muted-foreground" role="group" aria-label="View"><button aria-label="Grid view" aria-pressed={view === "grid"} className={view === "grid" ? "!bg-foreground !text-background" : ""} onClick={() => setView("grid")}><Grid2X2 size={16}/></button><button aria-label="List view" aria-pressed={view === "list"} className={view === "list" ? "!bg-foreground !text-background" : ""} onClick={() => setView("list")}><List size={16}/></button></div><button className="inline-flex min-h-[38px] items-center justify-center gap-[7px] rounded-lg border border-input bg-card px-[13px] py-2 text-[13px] font-bold text-foreground hover:bg-accent" onClick={() => setManage(true)}>Manage</button><button className="inline-flex min-h-[38px] items-center justify-center gap-[7px] rounded-lg border border-input bg-card px-[13px] py-2 text-[13px] font-bold text-foreground hover:bg-accent" onClick={() => setShowTrash(true)}><Trash2 size={15}/> Trash</button><button className="inline-flex min-h-[38px] items-center justify-center gap-[7px] rounded-lg border border-primary bg-primary px-[13px] py-2 text-[13px] font-bold text-primary-foreground" onClick={() => setCreateOpen(true)}><Plus size={16}/> New link</button></div>
      <p className="mb-3 flex items-center gap-2 text-[12.5px] text-muted-foreground [&_button]:font-bold [&_button]:text-primary">{filtered.length} {filtered.length === 1 ? "link" : "links"}{tag ? ` · #${tag}` : ""}{(tag || search || filter !== "all") && <button onClick={reset}>Clear filters</button>}</p>
      {filtered.length === 0 ? <StashEmpty icon={Link2} title={links.length === 0 ? "No links here yet" : "No links match"} description={links.length === 0 ? "Save your first one — paste a URL and Stash fills in the rest." : "Try a different search or filter."} action={links.length === 0 ? "Save your first link" : "Clear filters"} onAction={links.length === 0 ? () => setCreateOpen(true) : reset} /> : <div className={`grid gap-3.5 ${view === "list" ? "grid-cols-1 [&>article]:flex-row [&>article]:flex-wrap [&>article]:items-center [&>article]:gap-3.5 [&>article]:px-4 [&>article]:py-3" : "grid-cols-[repeat(auto-fill,minmax(min(252px,100%),1fr))]"}`}>{filtered.map(link => {
        const host = hostOf(link.url), folder = folders.find(f => f.id === link.folderId);
        return <article key={link.id} className="relative flex min-w-0 flex-col gap-2.5 rounded-[14px] border border-border bg-card p-4 [overflow-wrap:anywhere] hover:-translate-y-0.5 hover:shadow-sm"><div className="flex items-center gap-2.5"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-[9px] bg-primary/10 text-[15px] font-extrabold text-primary">{(link.title || host).charAt(0).toUpperCase()}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-muted-foreground">{host}</span><span className="block truncate text-[11px] text-muted-foreground">{new Date(link.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span></span><div className="ml-auto flex gap-0.5 [&_button]:grid [&_button]:h-[30px] [&_button]:w-[30px] [&_button]:place-items-center [&_button]:rounded-[7px] [&_button]:text-muted-foreground [&_button:hover]:bg-accent [&_button:hover]:text-foreground"><button aria-label={link.isPinned ? "Unpin link" : "Pin link"} aria-pressed={link.isPinned} onClick={() => pin.mutate(link.id, { onError: () => toast.error("Could not update pin") })}><Pin size={16} className={link.isPinned ? "text-primary" : ""}/></button><button aria-label="Edit link" onClick={() => setEditing(link)}><Pencil size={16}/></button><button aria-label="Move link to trash" onClick={() => { if (window.confirm("Move this link to trash?")) remove.mutate(link.id, { onSuccess: () => toast.success("Moved to trash"), onError: () => toast.error("Could not move to trash") }); }}><Trash2 size={16}/></button></div></div><div className="min-w-0 flex-1 [overflow-wrap:anywhere]"><a className="text-sm font-bold leading-[1.4] hover:text-primary" href={link.url} target="_blank" rel="noopener noreferrer">{link.title || host} <ExternalLink size={13} className="inline" /></a>{link.description && <p className="mt-1 text-xs text-muted-foreground">{link.description}</p>}</div><div className="mt-auto flex flex-wrap gap-[5px] [&_span]:rounded-full [&_span]:border [&_span]:border-border [&_span]:bg-accent [&_span]:px-[9px] [&_span]:py-0.5 [&_span]:text-[11px] [&_span]:font-bold [&_span]:text-muted-foreground [&_button]:rounded-full [&_button]:border [&_button]:border-border [&_button]:bg-accent [&_button]:px-[9px] [&_button]:py-0.5 [&_button]:text-[11px] [&_button]:font-bold [&_button]:text-muted-foreground">{folder && <span>{folder.name}</span>}{link.tags.map(t => <button key={t} onClick={() => setTag(t)}>#{t}</button>)}</div></article>;
      })}</div>}
    </main><CreateLinkDialog isOpen={createOpen} onClose={() => setCreateOpen(false)} /><EditLinkDialog link={editing} isOpen={!!editing} onClose={() => setEditing(null)} />
  </div>;
}
