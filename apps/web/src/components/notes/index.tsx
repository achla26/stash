"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FileText, Plus, Search, Trash2 } from "lucide-react";
import { useNotes } from "@/hooks/use-notes";
import { NotesPageSkeleton } from "@/components/shared/skeletons/page-skeleton";
import { ErrorState } from "@/components/shared/error-state";
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
  if (manage) return <div className="mx-auto max-w-[1080px]"><button onClick={() => setManage(false)} className="proto-link-button mb-4">← Back to notes</button><NotesManagement /></div>;

  return <section className="proto-notes mx-auto max-w-[1080px]" aria-label="Notes">
    <div className="proto-notes-toolbar"><div className="proto-notes-search"><Search size={16} aria-hidden="true"/><label className="sr-only" htmlFor="notes-search">Search notes</label><input id="notes-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search notes…"/></div><button className="proto-link-button" onClick={() => setManage(true)}>Manage</button><button className="proto-link-button" onClick={() => setShowTrash(true)}><Trash2 size={16}/> Trash</button><button className="proto-link-button primary" onClick={() => setCreateOpen(true)}><Plus size={16}/> New note</button></div>
    {filtered.length ? <div className="proto-note-list">{filtered.map(note => <Link href={`/notes/${note.id}`} key={note.id} className="proto-note-row"><span className="proto-note-icon"><FileText size={17}/></span><span className="proto-note-body"><strong>{note.title || "Untitled"}</strong><span>{note.content || "No content yet"}</span></span><time>{timeAgo(note.updatedAt)}</time></Link>)}</div> : <div className="proto-links-empty"><span><FileText size={22}/></span><h2>{query.trim() ? "No notes match" : "No notes yet"}</h2><p>{query.trim() ? "Try a different search." : "Capture a thought before it escapes."}</p><button className="proto-link-button primary" onClick={query.trim() ? () => setQuery("") : () => setCreateOpen(true)}>{query.trim() ? "Clear search" : "Write a note"}</button></div>}
    <CreateNoteDialog isOpen={createOpen} onClose={() => setCreateOpen(false)} />
  </section>;
}
