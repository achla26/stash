"use client";
import { StatStrip } from "@/components/shared/stat-strip";
import { Button } from "@/components/ui/button";
import { Page, Grid, SectionHeader } from "@/components/ui/layout";
import { NotebookGridCard } from "./notebook-grid-card";

import { useMemo, useState } from "react";
import { BookOpen, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  useNotebooks,
  useDeleteNotebook,
  useTogglePinNotebook,
} from "@/hooks/use-notebooks";
import { NotebooksPageSkeleton } from "@/components/shared/skeletons/page-skeleton";
import { SearchField, StashEmpty } from "@/components/shared/stash-ui";
import { ErrorState } from "@/components/shared/error-state";
import { CreateNotebookDialog } from "./create-notebook-dialog";
import { EditNotebookDialog } from "./edit-notebook-dialog";
import type { NotebookWithCounts } from "@repo/contracts/types";

export function NotebooksContent() {
  const {
    data: notebooks = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useNotebooks();
  const pin = useTogglePinNotebook(),
    remove = useDeleteNotebook();
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<NotebookWithCounts | null>(null);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notebooks
      .filter(
        (n) =>
          !q || `${n.name} ${n.description ?? ""}`.toLowerCase().includes(q),
      )
      .sort(
        (a, b) =>
          Number(b.isPinned) - Number(a.isPinned) ||
          +new Date(b.updatedAt) - +new Date(a.updatedAt),
      );
  }, [notebooks, query]);
  if (isLoading) return <NotebooksPageSkeleton />;
  if (isError)
    return (
      <div className="mx-auto max-w-[1080px]">
        <ErrorState
          message={(error as Error)?.message ?? "Failed to load notebooks"}
          onRetry={() => refetch()}
        />
      </div>
    );
  const folderCount = notebooks.reduce(
    (sum, n) => sum + (n.foldersCount ?? 0),
    0,
  );
  const noteCount = notebooks.reduce((sum, n) => sum + (n.notesCount ?? 0), 0);
  return (
    <Page aria-label="Notebooks">
      <SectionHeader
        heading="h1"
        title="Your notebooks"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> New notebook
          </Button>
        }
      />
      <StatStrip
        items={[
          { label: "Notebooks", value: notebooks.length },
          { label: "Folders", value: folderCount },
          { label: "Notes inside", value: noteCount },
        ]}
      />
      <SearchField
        label="Search notebooks"
        placeholder="Search notebooks…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-3.5"
      />
      {filtered.length === 0 ? (
        <StashEmpty
          icon={BookOpen}
          title={query.trim() ? "No notebooks match" : "No notebooks yet"}
          description={
            query.trim()
              ? "Try a different search."
              : "Create a notebook to organise your notes."
          }
          action={query.trim() ? "Clear search" : "New notebook"}
          onAction={
            query.trim() ? () => setQuery("") : () => setCreateOpen(true)
          }
        />
      ) : (
        <Grid className="grid-cols-[repeat(auto-fill,minmax(min(244px,100%),1fr))] gap-3.5">
          {filtered.map((nb) => (
            <NotebookGridCard
              key={nb.id}
              notebook={nb}
              onPin={() =>
                pin.mutate(nb.id, {
                  onError: () => toast.error("Could not update pin"),
                })
              }
              onEdit={() => setEditing(nb)}
              onDelete={() => {
                if (
                  window.confirm(`Move “${nb.name}” and its contents to trash?`)
                )
                  remove.mutate(nb.id, {
                    onSuccess: () => toast.success("Notebook moved to trash"),
                    onError: () => toast.error("Could not delete notebook"),
                  });
              }}
            />
          ))}
        </Grid>
      )}
      <CreateNotebookDialog
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
      />
      {editing && (
        <EditNotebookDialog
          notebook={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </Page>
  );
}
