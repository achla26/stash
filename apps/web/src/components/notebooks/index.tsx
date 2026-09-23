"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Plus } from "lucide-react";

import {
  useNotebooks,
  useDeleteNotebook,
  useUpdateNotebook,
} from "@/hooks/use-notebooks";
import { CreateNotebookDialog } from "./create-notebook-dialog";
import { NotebookCard } from "./notebook-card";
import { SearchBar } from "@/components/shared/search-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { toast } from "sonner";

export function NotebooksContent() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: notebooks = [], isLoading, isError, error, refetch } =
    useNotebooks();
  const deleteMutation = useDeleteNotebook();
  const updateMutation = useUpdateNotebook();

  const filteredNotebooks = useMemo(() => {
    return notebooks.filter((nb) => {
      const matchesSearch =
        nb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (nb.description ?? "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [notebooks, searchQuery]);

  // Pinned first, then by updatedAt
  const sortedNotebooks = useMemo(() => {
    return [...filteredNotebooks].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return (
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    });
  }, [filteredNotebooks]);

  const handleDelete = (id: string, name: string) => {
    toast(`Delete "${name}"?`, {
      description: "Sections and pages inside will also be trashed.",
      action: {
        label: "Delete",
        onClick: () =>
          deleteMutation.mutate(id, {
            onSuccess: () => toast.success("Notebook moved to trash"),
            onError: () => toast.error("Failed to delete notebook"),
          }),
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
    });
  };

  const handlePin = (id: string) => {
    updateMutation.mutate({ id });
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl py-12 text-center">
        <p className="text-muted-foreground">Loading notebooks...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-6xl">
        <ErrorState
          message={(error as Error)?.message ?? "Failed to load notebooks"}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Notebooks</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {notebooks.length} notebooks
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-medium text-white gradient-button"
        >
          <Plus className="h-4 w-4" />
          New Notebook
        </button>
      </div>

      {/* Search */}
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search notebooks..."
      />

      {/* Grid */}
      {sortedNotebooks.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No notebooks yet"
          description="Create your first notebook to organize your notes."
          actionLabel="New Notebook"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedNotebooks.map((notebook) => (
            <NotebookCard
              key={notebook.id}
              notebook={notebook}
              onOpen={() => router.push(`/notebooks/${notebook.id}`)}
              onDelete={() => handleDelete(notebook.id, notebook.name)}
              onPin={() => handlePin(notebook.id)}
              isDeleting={deleteMutation.isPending}
              isPinning={updateMutation.isPending}
            />
          ))}
        </div>
      )}

      <CreateNotebookDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
}