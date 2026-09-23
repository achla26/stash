"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";

import {
  useNotebooks,
  useDeleteNotebook,
  useUpdateNotebook,
} from "@/hooks/use-notebooks";
import { CreateNotebookDialog } from "./create-notebook-dialog";
import { NotebookCard } from "./notebook-card";
import { PageHeader } from "@/components/shared/page-header";
import { SearchBar } from "@/components/shared/search-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { toast } from "sonner";

export function NotebooksContent() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const {
    data: notebooks = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useNotebooks();
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
      <PageHeader
        title="Notebooks"
        description={`${notebooks.length} notebooks`}
        actionLabel="New Notebook"
        onAction={() => setIsCreateOpen(true)}
      />

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
              onEdit={() => router.push(`/notebooks/${notebook.id}`)}
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