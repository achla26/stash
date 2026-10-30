"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { FileText, Plus, Trash2 } from "lucide-react";
import { useNotes } from "@/hooks/use-notes";
import { NotesPageSkeleton } from "@/components/shared/skeletons/page-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { SearchField, StashEmpty } from "@/components/shared/stash-ui";
import { Button } from "@/components/ui/button";
import { CreateNoteDialog } from "./create-note-dialog";
import { NotesTrash } from "./notes-trash";
import { NotesManagement } from "./notes-management";
import { timeAgo } from "@/utils";

export function NotesContent() {
  const { data: notes = [], isLoading, isError, error, refetch } = useNotes();
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [manage, setManage] = useState(false);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes.filter(note => !q || `${note.title || ""} ${note.content || ""}`.toLowerCase().includes(q));
  }, [notes, query]);
  if (isLoading) return <NotesPageSkeleton />;
  if (isError) return <div className="mx-auto max-w-[1080px]"><ErrorState message={(error as Error)?.message ?? "Failed to load notes"} onRetry={() => refetch()} /></div>;
  if (showTrash) return <div className="mx-auto max-w-[1080px]"><NotesTrash onBack={() => setShowTrash(false)} /></div>;
  if (manage) return <div className="mx-auto max-w-[1080px]"><Button variant="outline" className="mb-4" onClick={() => setManage(false)}>← Back to notes</Button><NotesManagement /></div>;
  return <section className="mx-auto w-full min-w-0 max-w-[1080px]" aria-label="Notes">
    <div className="mb-3.5 flex flex-wrap gap-2"><SearchField label="Search notes" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search notes…" className="flex-1"/><Button variant="outline" onClick={() => setManage(true)}>Manage</Button><Button variant="outline" onClick={() => setShowTrash(true)}><Trash2 size={16}/> Trash</Button><Button onClick={() => setCreateOpen(true)}><Plus size={16}/> New note</Button></div>
    {filtered.length ? <div className="flex flex-col gap-2.5">{filtered.map(note => <Link href={`/notes/${note.id}`} key={note.id} className="flex min-w-0 items-start gap-3.5 rounded-[10px] border border-border bg-card px-4 py-[15px] hover:shadow-sm"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-[9px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"><FileText size={17}/></span><span className="min-w-0 flex-1"><strong className="block truncate text-sm font-bold">{note.title || "Untitled"}</strong><span className="mt-1 line-clamp-2 break-words text-[12.5px] text-muted-foreground">{note.content || "No content yet"}</span></span><time className="shrink-0 pt-1 font-mono text-[11px] text-muted-foreground">{timeAgo(note.updatedAt)}</time></Link>)}</div> : <StashEmpty icon={FileText} title={query.trim() ? "No notes match" : "No notes yet"} description={query.trim() ? "Try a different search." : "Capture a thought before it escapes."} action={query.trim() ? "Clear search" : "Write a note"} onAction={query.trim() ? () => setQuery("") : () => setCreateOpen(true)}/>}
    <CreateNoteDialog isOpen={createOpen} onClose={() => setCreateOpen(false)} />
  </section>;
}
