"use client";
import { ItemIcon } from "@/components/shared/item-icon";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, FileText, Folder, Pencil, Pin, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useNotebooks, useDeleteNotebook, useTogglePinNotebook } from "@/hooks/use-notebooks";
import { NotebooksPageSkeleton } from "@/components/shared/skeletons/page-skeleton";
import { SearchField, StashEmpty } from "@/components/shared/stash-ui";
import { ErrorState } from "@/components/shared/error-state";
import { CreateNotebookDialog } from "./create-notebook-dialog";
import { EditNotebookDialog } from "./edit-notebook-dialog";
import { timeAgo } from "@/utils";
import type { NotebookWithCounts } from "@repo/contracts/types";

export function NotebooksContent() {
  const { data: notebooks = [], isLoading, isError, error, refetch } = useNotebooks();
  const pin = useTogglePinNotebook(), remove = useDeleteNotebook();
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<NotebookWithCounts | null>(null);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notebooks.filter(n => !q || `${n.name} ${n.description ?? ""}`.toLowerCase().includes(q)).sort((a,b) => Number(b.isPinned) - Number(a.isPinned) || +new Date(b.updatedAt) - +new Date(a.updatedAt));
  }, [notebooks, query]);
  if (isLoading) return <NotebooksPageSkeleton />;
  if (isError) return <div className="mx-auto max-w-[1080px]"><ErrorState message={(error as Error)?.message ?? "Failed to load notebooks"} onRetry={() => refetch()} /></div>;
  const folderCount = notebooks.reduce((sum, n) => sum + (n.foldersCount ?? 0), 0);
  const noteCount = notebooks.reduce((sum, n) => sum + (n.notesCount ?? 0), 0);
  return <section className="mx-auto w-full min-w-0 max-w-[1080px]" aria-label="Notebooks">
    <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3 [&_h1]:text-[15px] [&_h1]:font-extrabold"><h1>Your notebooks</h1><button className="inline-flex min-h-[38px] items-center gap-[7px] rounded-lg bg-primary px-3 text-[13px] font-bold text-primary-foreground" onClick={() => setCreateOpen(true)}><Plus size={16}/> New notebook</button></div>
    <div className="mb-5 flex overflow-hidden rounded-[10px] border border-border bg-card [&>div]:flex [&>div]:min-w-0 [&>div]:flex-1 [&>div]:flex-col [&>div]:gap-[3px] [&>div]:border-r [&>div]:border-border [&>div]:px-[18px] [&>div]:pb-3.5 [&>div]:pt-[15px] [&>div:last-child]:border-r-0 [&_strong]:text-[23px] [&_strong]:font-extrabold [&_strong]:leading-[1.1] [&_span]:text-[10.5px] [&_span]:font-extrabold [&_span]:uppercase [&_span]:tracking-[.1em] [&_span]:text-muted-foreground"><div><strong>{notebooks.length}</strong><span>Notebooks</span></div><div><strong>{folderCount}</strong><span>Folders</span></div><div><strong>{noteCount}</strong><span>Notes inside</span></div></div>
    <SearchField label="Search notebooks" placeholder="Search notebooks…" value={query} onChange={e => setQuery(e.target.value)} className="mb-3.5" />
    {filtered.length === 0 ? <StashEmpty icon={BookOpen} title={query.trim() ? "No notebooks match" : "No notebooks yet"} description={query.trim() ? "Try a different search." : "Create a notebook to organise your notes."} action={query.trim() ? "Clear search" : "New notebook"} onAction={query.trim() ? () => setQuery("") : () => setCreateOpen(true)} /> : <div className="grid grid-cols-[repeat(auto-fill,minmax(min(244px,100%),1fr))] gap-3.5">{filtered.map(nb => {
      const color = /^#[0-9a-f]{6}$/i.test(nb.coverColor || "") ? nb.coverColor : "#4F3DE8";
      return <article key={nb.id} className="relative min-w-0 rounded-[14px] border border-border bg-card hover:shadow-sm"><span className="absolute bottom-[18px] left-0 top-[18px] w-1 rounded-r" style={{backgroundColor:color}}/><div className="absolute right-2.5 top-2.5 z-[1] flex gap-0.5 [&_button]:grid [&_button]:h-[29px] [&_button]:w-[29px] [&_button]:place-items-center [&_button]:rounded-[7px] [&_button]:text-muted-foreground [&_button:hover]:bg-accent [&_button:hover]:text-foreground"><button aria-label={nb.isPinned ? `Unpin ${nb.name}` : `Pin ${nb.name}`} aria-pressed={nb.isPinned} onClick={() => pin.mutate(nb.id,{onError:()=>toast.error("Could not update pin")})}><Pin size={15} className={nb.isPinned ? "text-primary" : ""}/></button><button aria-label={`Edit ${nb.name}`} onClick={() => setEditing(nb)}><Pencil size={15}/></button><button aria-label={`Delete ${nb.name}`} onClick={() => { if (window.confirm(`Move “${nb.name}” and its contents to trash?`)) remove.mutate(nb.id,{onSuccess:()=>toast.success("Notebook moved to trash"),onError:()=>toast.error("Could not delete notebook")}); }}><Trash2 size={15}/></button></div><Link href={`/notebooks/${nb.id}`} className="flex min-h-[196px] min-w-0 flex-col p-[18px] [&>strong]:truncate [&>strong]:pr-14 [&>strong]:text-[15px] [&>strong]:font-extrabold"><span className="mb-[13px] grid h-[46px] w-[46px] place-items-center rounded-[11px] text-[22px]" style={{backgroundColor:`${color}22`,color}}><ItemIcon value={nb.icon} fallback="book" size={23}/></span><strong>{nb.name}</strong><span className="mt-1 line-clamp-2 flex-1 text-[12.5px] leading-[1.55] text-muted-foreground [overflow-wrap:anywhere]">{nb.description || "No description yet."}</span><span className="mt-3 flex flex-wrap gap-3 text-[11.5px] font-semibold text-muted-foreground [&_span]:inline-flex [&_span]:items-center [&_span]:gap-1"><span><Folder size={12}/> {nb.foldersCount ?? 0} folders</span><span><FileText size={12}/> {nb.notesCount ?? 0} notes</span></span><span className="mt-3 flex items-center justify-between border-t border-border pt-[11px] text-[11px] text-muted-foreground"><span>{timeAgo(nb.updatedAt)}</span><span>Open →</span></span></Link></article>;
    })}</div>}
    <CreateNotebookDialog isOpen={createOpen} onClose={() => setCreateOpen(false)}/>{editing && <EditNotebookDialog notebook={editing} onClose={() => setEditing(null)}/>}
  </section>;
}
