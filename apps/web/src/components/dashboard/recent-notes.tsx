import { MoreHorizontal, Folder } from "lucide-react";

interface Note {
  id: number;
  title: string;
  preview: string;
  date: string;
  folder: string;
}

export function RecentNotes({ notes }: { notes: Note[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {notes.map((note) => (
        <NotePreviewCard key={note.id} note={note} />
      ))}
    </div>
  );
}

function NotePreviewCard({ note }: { note: Note }) {
  return (
    <div className="glass card-hover group cursor-pointer rounded-xl border border-border p-4">
      <div className="mb-2 flex items-start justify-between">
        <h4 className="line-clamp-1 font-medium text-foreground">
          {note.title}
        </h4>
        <button className="rounded p-1 text-muted-foreground opacity-0 transition-all hover:bg-accent group-hover:opacity-100">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
        {note.preview}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 rounded-md bg-accent px-2 py-1 text-xs text-primary">
          <Folder className="h-3 w-3" />
          {note.folder}
        </div>
        <span className="text-xs text-muted-foreground">{note.date}</span>
      </div>
    </div>
  );
}