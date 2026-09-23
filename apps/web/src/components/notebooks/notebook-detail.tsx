"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  FileText,
  Layers,
  Trash2,
  Loader2,
  Pencil
} from "lucide-react";

import {
  useNotebook,
  useSections,
  usePages,
  useCreateSection,
  useCreatePage,
  useDeleteSection,
  useDeletePage,
  useUpdateSection,
} from "@/hooks/use-notebooks";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/utils";
import { toast } from "sonner";
import type { SectionWithPages, Page } from "@repo/contracts/types";
import { useQueryClient } from "@tanstack/react-query";

export function NotebookDetail() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const notebookId = params.id;

  const { data: notebook, isLoading: notebookLoading } =
    useNotebook(notebookId);
  const { data: sections = [], isLoading: sectionsLoading } =
    useSections(notebookId);

  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Auto-select first section
  const selectedSectionId =
    activeSection ?? (sections[0]?.id ?? null);

  const { data: pages = [], isLoading: pagesLoading } = usePages(
    notebookId,
    selectedSectionId ?? ""
  );
  const queryClient = useQueryClient();

  const createSectionMutation = useCreateSection();
  const createPageMutation = useCreatePage();
  const deleteSectionMutation = useDeleteSection();
  const deletePageMutation = useDeletePage();
  const updateSectionMutation = useUpdateSection();

  const handleCreateSection = () => {
    const name = window.prompt("Section name:", "New Section");
    if (!name?.trim()) return;

    createSectionMutation.mutate(
      { notebookId, name: name.trim(), icon: "📑" },
      {
        onSuccess: (section) => {
          setActiveSection(section.id);
          toast.success("Section created");
        },
        onError: () => toast.error("Failed to create section"),
      }
    );
  };
  const handleRenameSection = (sectionId: string, currentName: string) => {
    const newName = window.prompt("Rename section:", currentName);
    if (!newName?.trim() || newName.trim() === currentName) return;

    updateSectionMutation.mutate(
      { notebookId, sectionId, name: newName.trim() },
      {
        onSuccess: () => toast.success("Section renamed"),
        onError: () => toast.error("Failed to rename section"),
      }
    );
  };

  const handleCreatePage = () => {
    if (!selectedSectionId) {
      toast.error("Create a section first");
      return;
    }

    createPageMutation.mutate(
      { notebookId, sectionId: selectedSectionId },
      {
        onSuccess: async (page) => {
          // Wait for invalidation to complete
          await queryClient.invalidateQueries({ queryKey: ["notebook"] });
          router.push(`/notebooks/${notebookId}/pages/${page.id}`);
        },
        onError: () => toast.error("Failed to create page"),
      }
    );
  };

  const handleDeleteSection = (sectionId: string) => {
    deleteSectionMutation.mutate(
      { notebookId, sectionId },
      {
        onSuccess: () => {
          if (activeSection === sectionId) setActiveSection(null);
          toast.success("Section deleted");
        },
        onError: () => toast.error("Failed to delete section"),
      }
    );
  };

  const handleDeletePage = (pageId: string) => {
    deletePageMutation.mutate(pageId, {
      onSuccess: () => toast.success("Page deleted"),
      onError: () => toast.error("Failed to delete page"),
    });
  };

  if (notebookLoading || sectionsLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!notebook) {
    return (
      <div className="mx-auto max-w-4xl py-12 text-center">
        <p className="text-destructive">Notebook not found</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.push("/notebooks")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${notebook.coverColor}20` }}
          >
            <span className="text-xl">{notebook.icon}</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {notebook.name}
            </h2>
            {notebook.description && (
              <p className="text-sm text-muted-foreground">
                {notebook.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex gap-6">
        {/* Left Sidebar — Sections */}
        <div className="w-64 shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              Sections
            </h3>
            <button
              onClick={handleCreateSection}
              disabled={createSectionMutation.isPending}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              title="Add section"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {sections.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              No sections yet
            </p>
          ) : (
            <div className="space-y-1">
              {sections.map((section) => (
                <SectionItem
                  key={section.id}
                  section={section}
                  isActive={selectedSectionId === section.id}
                  onSelect={() => setActiveSection(section.id)}
                  onDelete={() => handleDeleteSection(section.id)}
                  onRename={() => handleRenameSection(section.id, section.name)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Content — Pages */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              Pages
            </h3>
            <button
              onClick={handleCreatePage}
              disabled={
                !selectedSectionId || createPageMutation.isPending
              }
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white gradient-button disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              New Page
            </button>
          </div>

          {!selectedSectionId ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Select or create a section to see pages
            </p>
          ) : pagesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : pages.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No pages in this section yet
            </p>
          ) : (
            <div className="space-y-2">
              {pages.map((page) => (
                <PageItem
                  key={page.id}
                  page={page}
                  notebookId={notebookId}
                  onDelete={() => handleDeletePage(page.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===== Sub Components ===== */

function SectionItem({
  section,
  isActive,
  onSelect,
  onDelete,
  onRename,
}: {
  section: SectionWithPages;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onRename();
      }}
      className={cn(
        "group flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-all",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      <div className="flex items-center gap-2">
        <span>{section.icon}</span>
        <span className="font-medium">{section.name}</span>
        <span className="text-xs opacity-60">
          {section.pagesCount}
        </span>
      </div>

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRename();
          }}
          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-all hover:bg-accent hover:text-foreground"
          title="Rename section"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
          title="Delete section"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
function PageItem({
  page,
  notebookId,
  onDelete,
}: {
  page: Page;
  notebookId: string;
  onDelete: () => void;
}) {
  const router = useRouter();

  return (
    <div
      onClick={() =>
        router.push(`/notebooks/${notebookId}/pages/${page.id}`)
      }
      className="group flex cursor-pointer items-center justify-between rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h4 className="font-medium text-foreground">
            {page.title || "Untitled"}
          </h4>
          {page.isPinned && (
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
              Pinned
            </span>
          )}
        </div>
        {page.content && (
          <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
            {page.content.slice(0, 100)}
          </p>
        )}
        <span className="mt-2 block text-xs text-muted-foreground">
          {timeAgo(page.updatedAt)}
        </span>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}