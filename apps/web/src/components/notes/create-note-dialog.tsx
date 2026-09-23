"use client";

import { X, FileText, Folder } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { createNoteSchema, type CreateNoteInput } from "@repo/contracts/schemas";
import { useCreateNote } from "@/hooks/use-notes";
import { useTypeFolders } from "@/hooks/use-folder";

interface CreateNoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateNoteDialog({ isOpen, onClose }: CreateNoteDialogProps) {
  const createNoteMutation = useCreateNote();
  const { data: folders = [] } = useTypeFolders("note");

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateNoteInput>({
    resolver: zodResolver(createNoteSchema),
    defaultValues: {
      title: "",
      content: null,
      folderId: null,
    },
  });

  function onSubmit(values: CreateNoteInput) {
    createNoteMutation.mutate(values, {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  }

  function handleClose() {
    reset();
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">
            Create New Note
          </h2>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <FileText className="h-4 w-4 text-primary" />
              Note Title
            </label>
            <input
              type="text"
              {...register("title")}
              placeholder="Enter note title..."
              className="w-full rounded-xl border border-border bg-transparent px-4 py-3 text-sm text-foreground outline-none transition-all focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            />
            {errors.title && (
              <p className="text-xs text-destructive">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Content
            </label>
            <textarea
              {...register("content")}
              placeholder="Start writing your note..."
              rows={6}
              className="w-full resize-none rounded-xl border border-border bg-transparent px-4 py-3 text-sm text-foreground outline-none transition-all focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            />
          </div>

          {/* Folder */}
          {folders.length > 0 && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Folder className="h-4 w-4 text-primary" />
                Folder
                <span className="text-xs font-normal text-muted-foreground">
                  (optional)
                </span>
              </label>
              <Controller
                name="folderId"
                control={control}
                render={({ field }) => (
                  <select
                    value={field.value ?? "none"}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "none" ? null : e.target.value
                      )
                    }
                    className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:ring-2 focus:ring-ring"
                  >
                    <option value="none">No folder</option>
                    {folders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.icon} {folder.name}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>
          )}

          {/* Error */}
          {createNoteMutation.isError && (
            <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {(createNoteMutation.error as Error)?.message ??
                "Failed to create note"}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createNoteMutation.isPending}
              className="flex-1 rounded-xl px-4 py-3 text-sm font-medium text-white gradient-button disabled:opacity-50"
            >
              {createNoteMutation.isPending ? "Saving..." : "Save Note"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}