"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Trash2, Check, Loader2 } from "lucide-react";

import { usePage, useUpdatePage, useDeletePage } from "@/hooks/use-notebooks";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button";

type SaveStatus = "saved" | "unsaved" | "saving";

export function PageEditor() {
  const router = useRouter();
  const params = useParams<{ id: string; pageId: string }>();
  const notebookId = params.id;
  const pageId = params.pageId;

  const { data: page, isLoading, isError, error } = usePage(pageId);
  const updateMutation = useUpdatePage();
  const deleteMutation = useDeletePage();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");

  const isFirstLoad = useRef(true);

  // Load page data
  useEffect(() => {
    if (page && isFirstLoad.current) {
      setTitle(page.title ?? "");
      setContent(page.content ?? "");
      isFirstLoad.current = false;
    }
  }, [page]);

  const debouncedTitle = useDebounce(title, 800);
  const debouncedContent = useDebounce(content, 800);

  const originalTitle = useMemo(() => page?.title ?? "", [page?.title]);
  const originalContent = useMemo(
    () => page?.content ?? "",
    [page?.content]
  );

  // Mark unsaved
  useEffect(() => {
    if (isFirstLoad.current) return;
    if (title !== originalTitle || content !== originalContent) {
      setSaveStatus("unsaved");
    }
  }, [title, content, originalTitle, originalContent]);

  // Auto-save
  useEffect(() => {
    if (isFirstLoad.current) return;
    if (!pageId) return;

    const hasChanges =
      debouncedTitle !== originalTitle ||
      debouncedContent !== originalContent;

    if (!hasChanges) return;

    setSaveStatus("saving");

    updateMutation.mutate(
      {
        pageId,
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
    if (!pageId) return;

    const confirmed = window.confirm("Delete this page?");
    if (!confirmed) return;

    deleteMutation.mutate(pageId, {
      onSuccess: () => router.push(`/notebooks/${notebookId}`),
    });
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl py-12 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !page) {
    return (
      <div className="mx-auto max-w-4xl py-12 text-center">
        <p className="text-destructive">
          {(error as Error)?.message ?? "Page not found"}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.push(`/notebooks/${notebookId}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

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

        <Button
          variant="outline"
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {deleteMutation.isPending ? "Deleting..." : "Delete"}
        </Button>
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

      {/* Meta */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Created: {new Date(page.createdAt).toLocaleString()}
        </span>
        <span>
          Updated: {new Date(page.updatedAt).toLocaleString()}
        </span>
      </div>
    </div>
  );
}