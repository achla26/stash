"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Trash2, Check, Loader2 } from "lucide-react";

import { useDeleteNote, useNote, useUpdateNote } from "@/hooks/use-notes";
import { useFolders } from "@/hooks/use-folder";
import { useNotebooks } from "@/hooks/use-notebooks";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button";

function getTextContent(content: string | null | undefined): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  return "";
}

type SaveStatus = "saved" | "unsaved" | "saving";

export function NoteEditor() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const noteId = params.id;

  const { data: note, isLoading, isError, error } = useNote(noteId);
  const updateNoteMutation = useUpdateNote();
  const deleteNoteMutation = useDeleteNote();
  const { data: folders = [] } = useFolders();
  const { data: notebooks = [] } = useNotebooks();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");

  const isFirstLoad = useRef(true);

  // Load note on first fetch
  useEffect(() => {
    if (note && isFirstLoad.current) {
      setTitle(note.title ?? "");
      setContent(getTextContent(note.content));
      isFirstLoad.current = false;
    }
  }, [note]);

  const debouncedTitle = useDebounce(title, 800);
  const debouncedContent = useDebounce(content, 800);

  // camelCase — note.title, note.content
  const originalTitle = useMemo(() => note?.title ?? "", [note?.title]);
  const originalContent = useMemo(
    () => getTextContent(note?.content),
    [note?.content]
  );

  // Mark unsaved when user types
  useEffect(() => {
    if (isFirstLoad.current) return;
    if (title !== originalTitle || content !== originalContent) {
      setSaveStatus("unsaved");
    }
  }, [title, content, originalTitle, originalContent]);

  // Auto-save on debounce
  useEffect(() => {
    if (isFirstLoad.current) return;
    if (!noteId) return;

    const hasChanges =
      debouncedTitle !== originalTitle ||
      debouncedContent !== originalContent;

    if (!hasChanges) return;

    setSaveStatus("saving");

    updateNoteMutation.mutate(
      {
        id: noteId,
        title: debouncedTitle.trim() || "Untitled",
        content: debouncedContent,
      },
      {
        onSuccess: () => setSaveStatus("saved"),
        onError: () => setSaveStatus("unsaved"),
      }
    );
  }, [debouncedTitle, debouncedContent]);

  const handleDelete = () => {
    if (!noteId) return;

    const confirmed = window.confirm("Move this note to trash?");
    if (!confirmed) return;

    deleteNoteMutation.mutate(noteId, {
      onSuccess: () => router.push("/notes"),
    });
  };

  // v2 placement: note loose / folder / notebook me move karo
  const handleMove = (value: string) => {
    if (!noteId) return;
    let folderId: string | null = null;
    let notebookId: string | null = null;
    if (value.startsWith("f:")) folderId = value.slice(2);
    if (value.startsWith("nb:")) notebookId = value.slice(2);
    updateNoteMutation.mutate({ id: noteId, folderId, notebookId });
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl py-12">
        <p className="text-muted-foreground">Loading note...</p>
      </div>
    );
  }

  if (isError || !note) {
    return (
      <div className="mx-auto max-w-4xl py-12">
        <p className="text-destructive">
          {(error as Error)?.message ?? "Note not found"}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.push("/notes")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {/* Save Status */}
          <div className="flex items-center gap-2">
            {saveStatus === "saving" && (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Saving...
                </span>
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-500">Saved</span>
              </>
            )}
            {saveStatus === "unsaved" && (
              <span className="text-sm text-warning">
                Unsaved changes
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            aria-label="Note location"
            value={
              note.notebookId
                ? `nb:${note.notebookId}`
                : note.folderId
                  ? `f:${note.folderId}`
                  : "loose"
            }
            onChange={(e) => handleMove(e.target.value)}
            className="h-9 max-w-[180px] rounded-lg border border-border bg-card px-2 text-sm text-muted-foreground outline-none"
          >
            <option value="loose">Loose note</option>
            {folders
              .filter((f) => !f.isTrashed)
              .map((f) => (
                <option key={f.id} value={`f:${f.id}`}>
                  Folder: {f.name}
                </option>
              ))}
            {notebooks
              .filter((n) => !n.isTrashed)
              .map((n) => (
                <option key={n.id} value={`nb:${n.id}`}>
                  Notebook: {n.name}
                </option>
              ))}
          </select>
          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={deleteNoteMutation.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {deleteNoteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>

      {/* Title */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled"
          className="w-full bg-transparent text-2xl font-semibold text-foreground outline-none"
        />
      </div>

      {/* Content */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing..."
          rows={20}
          className="w-full resize-none bg-transparent text-sm leading-relaxed text-foreground outline-none"
        />
      </div>

      {/* Meta Info — camelCase fields */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Created: {new Date(note.createdAt).toLocaleString()}
        </span>
        <span>
          Updated: {new Date(note.updatedAt).toLocaleString()}
        </span>
      </div>
    </div>
  );
}