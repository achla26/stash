"use client";

import { useState } from "react";
import { FolderPlus, Loader2, Plus, X, AlertCircle } from "lucide-react";
import { useForm, Controller, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCreateFolder,
  useDeleteFolder,
  useTypeFolders,
} from "@/hooks/use-folder";
import { CreateFolderInput, createFolderSchema } from "@repo/contracts/schemas";

interface CollectionBarProps {
  activeCollection: string | undefined;
  onSelect: (collectionId: string | undefined) => void;
}

const ICONS = [
  "📁", "🎨", "💼", "📚", "🎮",
  "🔬", "🎵", "🏠", "💰", "🌍",
];

export function CollectionBar({ activeCollection, onSelect }: CollectionBarProps) {
  const [showCreate, setShowCreate] = useState(false);

  const { data: folders = [], isLoading, isError } = useTypeFolders("link");
  const createFolderMutation = useCreateFolder();
  const deleteFolderMutation = useDeleteFolder();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateFolderInput>({
    resolver: zodResolver(createFolderSchema) as Resolver<CreateFolderInput>,
    defaultValues: {
      name: "",
      icon: "📁",
      type: "link",
    },
  });

  function onSubmit(values: CreateFolderInput) {
    createFolderMutation.mutate(
      { name: values.name.trim(), icon: values.icon, type: "link" },
      {
        onSuccess: () => {
          reset();
          setShowCreate(false);
          toast.success("Collection created!");
        },
        onError: (error: any) => {
          toast.error(error?.message || "Failed to create collection");
        },
      }
    );
  }

  function handleDelete(id: string, name: string) {
    const mutation = deleteFolderMutation;

    toast(`Delete "${name}"?`, {
      description: "Links inside will not be deleted.",
      action: {
        label: "Delete",
        onClick: () =>
          mutation.mutate(id, {
            onSuccess: () => {
              if (activeCollection === id) onSelect(undefined);
              toast.success("Collection deleted");
            },
            onError: () => toast.error("Failed to delete collection"),
          }),
      },
      cancel: {
        label: "Cancel",
        onClick: () => { },
      },
    });
  }

  function handleCancel() {
    reset();
    setShowCreate(false);
  }

  return (
    <div className="space-y-3">
      {/* Tab Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* All Links */}
        <CollectionChip
          label="All links"
          isActive={!activeCollection}
          onClick={() => onSelect(undefined)}
        />

        {/* Loading Skeleton */}
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-9 w-24 animate-pulse rounded-full bg-accent"
            />
          ))}

        {/* Error */}
        {isError && (
          <div className="flex items-center gap-1.5 text-xs text-destructive">
            <AlertCircle className="h-3.5 w-3.5" />
            Failed to load collections
          </div>
        )}

        {/* Folder Tabs */}
        {!isLoading &&
          folders.map((folder) => (
            <div key={folder.id} className="group relative">
              <button
                onClick={() =>
                  onSelect(
                    activeCollection === folder.id ? undefined : folder.id
                  )
                }
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 pr-8 text-sm font-medium transition-all duration-150",
                  activeCollection === folder.id
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-accent hover:text-foreground"
                )}
              >
                <span>{folder.icon}</span>
                <span>{folder.name}</span>
                {/* {folder.linkCount !== undefined && (
                  <span className="text-xs opacity-60">{folder.linkCount}</span>
                )} */}
              </button>

              {/* Delete */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(folder.id, folder.name);
                }}
                aria-label={`Delete ${folder.name}`}
                className="absolute right-1.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

        {/* Add Button */}
        {!showCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-full border border-dashed border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all hover:border-primary/40 hover:text-primary"
          >
            <Plus className="h-4 w-4" />
            Collection
          </button>
        )}
      </div>

      {/* Create Form */}
      {showCreate && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-3 rounded-xl border border-border bg-card p-4"
        >
          {/* Header */}
          <div className="flex items-center gap-2">
            <FolderPlus className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">
              New collection
            </p>
          </div>

          {/* Icon Picker */}
          <Controller
            name="icon"
            control={control}
            render={({ field }) => (
              <div className="flex flex-wrap gap-1.5">
                {ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => field.onChange(icon)}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg border text-sm transition-all",
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

          {/* Name + Actions */}
          <div className="flex items-center gap-2">
            <Input
              placeholder="Collection name…"
              {...register("name")}
              autoFocus
              className="flex-1"
            />
            <Button
              type="submit"
              size="sm"
              disabled={createFolderMutation.isPending}
            >
              {createFolderMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Add"
              )}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleCancel}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </form>
      )}
    </div>
  );
}

/* ===== Sub Component ===== */

function CollectionChip({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-150",
        isActive
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-accent hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}