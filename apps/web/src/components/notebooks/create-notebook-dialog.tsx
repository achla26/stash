"use client";

import { useEffect, useRef } from "react";
import { X, Loader2 } from "lucide-react";
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

const ICONS = [
  "📓",
  "📕",
  "📗",
  "📘",
  "📙",
  "📔",
  "📒",
  "📝",
  "🗂️",
  "💼",
];

export function CreateNotebookDialog({
  isOpen,
  onClose,
}: CreateNotebookDialogProps) {
  const createMutation = useCreateNotebook();
  const nameRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
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

  const icon = watch("icon");
  const coverColor = watch("coverColor");
  const name = watch("name");

  /* Autofocus + Esc + ⌘↵ */
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => nameRef.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !createMutation.isPending) handleClose();
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        handleSubmit(onSubmit)();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  function onSubmit(values: CreateNotebookInput) {
    createMutation.mutate(
      { ...values, name: values.name?.trim() || "Untitled notebook" },
      {
        onSuccess: () => {
          reset();
          onClose();
          toast.success("Notebook created!");
        },
        onError: (err) => {
          toast.error(
            err instanceof Error ? err.message : "Failed to create notebook",
          );
        },
      },
    );
  }

  function handleClose() {
    reset();
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Create notebook"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Sheet */}
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-border bg-card shadow-2xl sm:max-h-[85vh] sm:rounded-3xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-5 py-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={createMutation.isPending}
            className="-ml-1 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>

          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            New notebook
          </span>

          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={createMutation.isPending}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Creating
              </>
            ) : (
              "Create"
            )}
          </button>
        </div>

        {/* Body — scrollable */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8"
        >
          {/* Live preview + name/description */}
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
            {/* Live preview — the notebook card */}
            <div className="mx-auto flex shrink-0 flex-col items-center gap-3 sm:mx-0">
              <div
                className="flex h-28 w-24 items-center justify-center rounded-2xl text-5xl shadow-lg transition-all duration-200"
                style={{
                  backgroundColor: `${coverColor}22`,
                  border: `2px solid ${coverColor}`,
                }}
              >
                <span className="drop-shadow-sm">{icon}</span>
              </div>
              <div
                className="h-1 w-12 rounded-full transition-colors duration-200"
                style={{ backgroundColor: coverColor }}
              />
            </div>

            {/* Name + description */}
            <div className="min-w-0 flex-1">
              <input
                ref={(el) => {
                  nameRef.current = el;
                  register("name").ref(el);
                }}
                {...register("name")}
                placeholder="Untitled notebook"
                className="w-full border-none bg-transparent text-2xl font-bold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/40"
                spellCheck={false}
              />
              {errors.name && (
                <p className="mt-1.5 text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}

              <div className="my-4 h-px w-full bg-border/70" />

              <textarea
                {...register("description")}
                placeholder="What's this notebook about?"
                rows={3}
                className="w-full resize-none border-none bg-transparent text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/40"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Icon picker */}
          <div className="mt-8">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Icon
            </p>
            <Controller
              name="icon"
              control={control}
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {ICONS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => field.onChange(ic)}
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-xl text-xl transition-all",
                        field.value === ic
                          ? "bg-accent ring-2 ring-primary"
                          : "bg-muted/40 hover:bg-accent",
                      )}
                      aria-label={`Icon ${ic}`}
                      aria-pressed={field.value === ic}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>

          {/* Color picker */}
          <div className="mt-6">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Cover color
            </p>
            <Controller
              name="coverColor"
              control={control}
              render={({ field }) => (
                <div className="flex flex-wrap gap-3">
                  {COLORS.map((c) => {
                    const isActive = field.value === c.value;
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => field.onChange(c.value)}
                        className={cn(
                          "h-8 w-8 rounded-full transition-all duration-150",
                          isActive && "scale-110",
                        )}
                        style={{
                          backgroundColor: c.value,
                          boxShadow: isActive
                            ? `0 0 0 2px var(--card), 0 0 0 4px ${c.value}`
                            : undefined,
                        }}
                        title={c.name}
                        aria-label={`Color ${c.name}`}
                        aria-pressed={isActive}
                      />
                    );
                  })}
                </div>
              )}
            />
          </div>

          {/* Server error */}
          {createMutation.isError && (
            <p className="mt-6 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {createMutation.error instanceof Error
                ? createMutation.error.message
                : "Failed to create notebook"}
            </p>
          )}

          {/* Footer hint */}
          <div className="mt-8 flex items-center justify-between text-[11px] text-muted-foreground/60">
            <span>
              {name?.trim()
                ? `"${name.trim()}"`
                : "Untitled notebook"}
            </span>
            <span className="hidden sm:block">⌘↵ to create</span>
          </div>
        </form>
      </div>
    </div>
  );
}