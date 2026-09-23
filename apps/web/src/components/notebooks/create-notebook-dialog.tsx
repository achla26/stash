"use client";

import { X, BookOpen, Palette } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createNotebookSchema,
  type CreateNotebookInput,
} from "@repo/contracts/schemas";
import { useCreateNotebook } from "@/hooks/use-notebooks";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CreateNotebookDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLORS = [
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#22c55e" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Orange", value: "#f97316" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Pink", value: "#ec4899" },
  { name: "Red", value: "#ef4444" },
  { name: "Yellow", value: "#eab308" },
];

const ICONS = ["📓", "📕", "📗", "📘", "📙", "📔", "📒", "📝", "🗂️", "💼"];

export function CreateNotebookDialog({
  isOpen,
  onClose,
}: CreateNotebookDialogProps) {
  const createMutation = useCreateNotebook();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateNotebookInput>({
    resolver: zodResolver(createNotebookSchema) as never,
    defaultValues: {
      name: "",
      icon: "📓",
      coverColor: "#3b82f6",
      description: "",
    },
  });

  function onSubmit(values: CreateNotebookInput) {
    createMutation.mutate(values, {
      onSuccess: () => {
        reset();
        onClose();
        toast.success("Notebook created!");
      },
      onError: (err) => {
        toast.error(
          err instanceof Error ? err.message : "Failed to create notebook"
        );
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
            Create New Notebook
          </h2>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <BookOpen className="h-4 w-4 text-primary" />
              Notebook Name
            </label>
            <input
              type="text"
              {...register("name")}
              placeholder="Enter notebook name..."
              autoFocus
              className="w-full rounded-xl border border-border bg-transparent px-4 py-3 text-sm text-foreground outline-none transition-all focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            />
            {errors.name && (
              <p className="text-xs text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Description
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                (optional)
              </span>
            </label>
            <textarea
              {...register("description")}
              placeholder="What will this notebook be about?"
              rows={3}
              className="w-full resize-none rounded-xl border border-border bg-transparent px-4 py-3 text-sm text-foreground outline-none transition-all focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            />
          </div>

          {/* Icon Picker */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Icon
            </label>
            <Controller
              name="icon"
              control={control}
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => field.onChange(icon)}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg border text-lg transition-all",
                        field.value === icon
                          ? "border-primary bg-primary/10"
                          : "border-border bg-accent hover:bg-accent/80"
                      )}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Palette className="h-4 w-4 text-primary" />
              Cover Color
            </label>
            <Controller
              name="coverColor"
              control={control}
              render={({ field }) => (
                <div className="flex gap-3">
                  {COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => field.onChange(c.value)}
                      className={cn(
                        "h-10 w-10 rounded-xl transition-all",
                        field.value === c.value &&
                          "ring-2 ring-offset-2 ring-offset-card"
                      )}
                      style={{
                        backgroundColor: c.value,
                        ...(field.value === c.value
                          ? { boxShadow: `0 0 0 2px ${c.value}` }
                          : {}),
                      }}
                      title={c.name}
                    />
                  ))}
                </div>
              )}
            />
          </div>

          {/* Error */}
          {createMutation.isError && (
            <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {createMutation.error instanceof Error
                ? createMutation.error.message
                : "Failed to create notebook"}
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
              disabled={createMutation.isPending}
              className="flex-1 rounded-xl px-4 py-3 text-sm font-medium text-white gradient-button disabled:opacity-50"
            >
              {createMutation.isPending ? "Creating..." : "Create Notebook"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}