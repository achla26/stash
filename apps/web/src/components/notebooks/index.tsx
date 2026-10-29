"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, FileText, Folder, Pencil, Pin, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useNotebooks, useDeleteNotebook, useTogglePinNotebook } from "@/hooks/use-notebooks";
import { NotebooksPageSkeleton } from "@/components/shared/skeletons/page-skeleton";
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
  return <section className="proto-notebooks mx-auto max-w-[1080px]" aria-label="Notebooks">
    <div className="proto-notebooks-head"><h1>Your notebooks</h1><button className="proto-link-button primary" onClick={() => setCreateOpen(true)}><Plus size={16}/> New notebook</button></div>
    <div className="proto-glance proto-notebooks-glance"><div><strong>{notebooks.length}</strong><span>Notebooks</span></div><div><strong>{folderCount}</strong><span>Folders</span></div><div><strong>{noteCount}</strong><span>Notes inside</span></div></div>
    <div className="proto-notes-search proto-notebooks-search"><Search size={16}/><label htmlFor="notebooks-search" className="sr-only">Search notebooks</label><input id="notebooks-search" placeholder="Search notebooks…" value={query} onChange={e => setQuery(e.target.value)}/></div>
    {filtered.length === 0 ? <div className="proto-links-empty"><span><BookOpen size={22}/></span><h2>{query.trim() ? "No notebooks match" : "No notebooks yet"}</h2><p>{query.trim() ? "Try a different search." : "Create a notebook to organise your notes."}</p><button className="proto-link-button primary" onClick={query.trim() ? () => setQuery("") : () => setCreateOpen(true)}>{query.trim() ? "Clear search" : "New notebook"}</button></div> : <div className="proto-nb-grid">{filtered.map(nb => {
      const color = /^#[0-9a-f]{6}$/i.test(nb.coverColor || "") ? nb.coverColor : "#4F3DE8";
      return <article key={nb.id} className="proto-nb-card"><span className="proto-nb-bar" style={{backgroundColor:color}}/><div className="proto-nb-actions"><button aria-label={nb.isPinned ? `Unpin ${nb.name}` : `Pin ${nb.name}`} aria-pressed={nb.isPinned} onClick={() => pin.mutate(nb.id,{onError:()=>toast.error("Could not update pin")})}><Pin size={15} className={nb.isPinned ? "text-primary" : ""}/></button><button aria-label={`Edit ${nb.name}`} onClick={() => setEditing(nb)}><Pencil size={15}/></button><button aria-label={`Delete ${nb.name}`} onClick={() => { if (window.confirm(`Move “${nb.name}” and its contents to trash?`)) remove.mutate(nb.id,{onSuccess:()=>toast.success("Notebook moved to trash"),onError:()=>toast.error("Could not delete notebook")}); }}><Trash2 size={15}/></button></div><Link href={`/notebooks/${nb.id}`} className="proto-nb-open"><span className="proto-nb-icon" style={{backgroundColor:`${color}22`,color}}>{nb.icon || <BookOpen size={23}/>}</span><strong>{nb.name}</strong><span className="proto-nb-description">{nb.description || "No description yet."}</span><span className="proto-nb-meta"><span><Folder size={12}/> {nb.foldersCount ?? 0} folders</span><span><FileText size={12}/> {nb.notesCount ?? 0} notes</span></span><span className="proto-nb-foot"><span>{timeAgo(nb.updatedAt)}</span><span>Open →</span></span></Link></article>;
    })}</div>}
    <CreateNotebookDialog isOpen={createOpen} onClose={() => setCreateOpen(false)}/>{editing && <EditNotebookDialog notebook={editing} onClose={() => setEditing(null)}/>}
  </section>;
}
