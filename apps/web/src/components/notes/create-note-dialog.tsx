"use client";

import { useEffect, useRef, useState } from "react";
import {
  X,
  Folder,
  BookOpen,
  FileText,
  Check,
  Loader2,
} from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { createNoteSchema, type CreateNoteInput } from "@repo/contracts/schemas";
import { useCreateNote } from "@/hooks/use-notes";
import { useTypeFolders } from "@/hooks/use-folder";
import { cn } from "@/lib/utils";

interface CreateNoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

/* ---------- Small popover for the folder pill (same pattern as editor) ---------- */

function Popover({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      ref={ref}
      className="absolute bottom-[calc(100%+8px)] left-0 z-50 min-w-[220px] overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-lg"
    >
      {children}
    </div>
  );
}

function PopoverItem({
  icon: Icon,
  label,
  onClick,
  active,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent",
        active && "bg-accent",
      )}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0 opacity-70" />}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {active && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
    </button>
  );
}

/* ---------- Main dialog ---------- */

export function CreateNoteDialog({ isOpen, onClose }: CreateNoteDialogProps) {
  const createNoteMutation = useCreateNote();
  const { data: folders = [] } = useTypeFolders("note");

  const [folderMenuOpen, setFolderMenuOpen] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateNoteInput>({
    resolver: zodResolver(createNoteSchema),
    defaultValues: {
      title: "",
      content: null,
      folderId: null,
    },
  });

  const selectedFolderId = watch("folderId");
  const selectedFolder = folders.find((f) => f.id === selectedFolderId);

  // Autofocus + Esc-close
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => titleRef.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !createNoteMutation.isPending) handleClose();
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

  function onSubmit(values: CreateNoteInput) {
    createNoteMutation.mutate(
      {
        ...values,
        title: values.title?.trim() || "Untitled",
      },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
      },
    );
  }

  function handleClose() {
    reset();
    setFolderMenuOpen(false);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Create note"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Sheet */}
      <div className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-border bg-card shadow-2xl sm:rounded-3xl">
        {/* Header — minimal */}
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={createNoteMutation.isPending}
            className="-ml-1 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>

          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            New note
          </span>

          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={createNoteMutation.isPending}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {createNoteMutation.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving
              </>
            ) : (
              "Save"
            )}
          </button>
        </div>

        {/* Writing surface */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex max-h-[70vh] flex-col overflow-y-auto px-6 py-6 sm:px-8 sm:py-8"
        >
          {/* Title */}
          <input
            ref={(el) => {
              titleRef.current = el;
              register("title").ref(el);
            }}
            {...register("title")}
            placeholder="Untitled"
            className="w-full border-none bg-transparent text-2xl font-bold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/40 sm:text-3xl"
            spellCheck={false}
          />
          {errors.title && (
            <p className="mt-2 text-xs text-destructive">
              {errors.title.message}
            </p>
          )}

          {/* Divider */}
          <div className="my-4 h-px w-full bg-border/70" />

          {/* Content */}
          <textarea
            {...register("content")}
            placeholder="Start writing…"
            rows={8}
            className="w-full resize-none border-none bg-transparent text-base leading-7 text-foreground outline-none placeholder:text-muted-foreground/40"
            spellCheck={false}
          />

          {/* Server error */}
          {createNoteMutation.isError && (
            <p className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {(createNoteMutation.error as Error)?.message ??
                "Failed to create note"}
            </p>
          )}

          {/* Folder pill — bottom-left, out of the way */}
          <div className="relative mt-6 flex items-center justify-between">
            <div className="relative">
              <button
                type="button"
                onClick={() => setFolderMenuOpen((v) => !v)}
                className={cn(
                  "inline-flex max-w-[240px] items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                  folderMenuOpen && "bg-accent text-foreground",
                )}
                aria-haspopup="menu"
                aria-expanded={folderMenuOpen}
              >
                {selectedFolder ? (
                  <Folder className="h-3.5 w-3.5 shrink-0 opacity-80" />
                ) : (
                  <FileText className="h-3.5 w-3.5 shrink-0 opacity-80" />
                )}
                <span className="truncate">
                  {selectedFolder
                    ? selectedFolder.name
                    : "Loose note"}
                </span>
              </button>

              <Controller
                name="folderId"
                control={control}
                render={({ field }) => (
                  <Popover
                    open={folderMenuOpen}
                    onClose={() => setFolderMenuOpen(false)}
                  >
                    <div className="px-2.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Save to
                    </div>
                    <PopoverItem
                      icon={FileText}
                      label="Loose note"
                      active={!field.value}
                      onClick={() => {
                        field.onChange(null);
                        setFolderMenuOpen(false);
                      }}
                    />
                    {folders.length > 0 && (
                      <div className="px-2.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Folders
                      </div>
                    )}
                    {folders.map((f) => (
                      <PopoverItem
                        key={f.id}
                        icon={Folder}
                        label={f.name}
                        active={field.value === f.id}
                        onClick={() => {
                          field.onChange(f.id);
                          setFolderMenuOpen(false);
                        }}
                      />
                    ))}
                  </Popover>
                )}
              />
            </div>

            <span className="hidden text-[11px] text-muted-foreground/60 sm:block">
              ⌘↵ to save
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}