"use client";

import { Link2, FileText, Folder, Tag, Check, ChevronDown } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";

import { createLinkSchema, type CreateLinkInput } from "@repo/contracts/schemas";
import { useCreateLink } from "@/hooks/use-links";
import { useTypeFolders } from "@/hooks/use-folder";
import { TagInput } from "./tag-input";
import { Label } from "@/components/ui/label";
import { FormDialog } from "@/components/ui/form-dialog";
import FormField from "../ui/form-field";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { useEffect, useRef, useState } from "react";
import { linkService } from "@/lib/services";
import { cn } from "@/lib/utils";

interface CreateLinkDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

/* ---------- Folder pill helpers ---------- */

function FolderPopover({
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
      className="absolute left-0 top-[calc(100%+6px)] z-50 min-w-[220px] overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-lg"
    >
      {children}
    </div>
  );
}

function FolderPopoverItem({
  label,
  emoji,
  isActive,
  onClick,
}: {
  label: string;
  emoji?: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent",
        isActive && "bg-accent"
      )}
    >
      <span className="flex h-5 w-5 items-center justify-center text-base">
        {emoji ?? <Folder className="h-3.5 w-3.5 opacity-70" />}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {isActive && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
    </button>
  );
}

/* ---------- Main dialog ---------- */

export function CreateLinkDialog({ isOpen, onClose }: CreateLinkDialogProps) {
  const createLinkMutation = useCreateLink();
  const { data: folders = [] } = useTypeFolders("link");

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateLinkInput>({
    resolver: zodResolver(createLinkSchema) as Resolver<CreateLinkInput>,
    defaultValues: {
      url: "",
      title: "",
      description: "",
      folderId: null,
      tags: [],
    },
  });

  // Auto title/icon: URL paste karo, 800ms ruko → meta auto-fill
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [folderMenuOpen, setFolderMenuOpen] = useState(false);
  const lastFetched = useRef<string>("");
  const urlValue = watch("url");

  useEffect(() => {
    if (!urlValue || !/^https?:\/\/.+/.test(urlValue)) return;
    if (lastFetched.current === urlValue) return;
    const t = setTimeout(async () => {
      lastFetched.current = urlValue;
      setFetchingMeta(true);
      try {
        const meta = await linkService.fetchMeta(urlValue);
        if (meta?.title) setValue("title", meta.title);
        if (meta?.description) setValue("description", meta.description);
      } catch {
        // preview fail = koi baat nahi, user khud type karega
      }
      setFetchingMeta(false);
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlValue]);

  function onSubmit(values: CreateLinkInput) {
    createLinkMutation.mutate(
      {
        url: values.url,
        title: values.title || undefined,
        description: values.description || undefined,
        folderId: values.folderId || undefined,
        tags: values.tags && values.tags.length > 0 ? values.tags : [],
      },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
      }
    );
  }

  function handleClose() {
    reset();
    setFolderMenuOpen(false);
    onClose();
  }

  return (
    <FormDialog
      open={isOpen}
      onClose={handleClose}
      title="Save New Link"
      footer={
        <div className="flex w-full gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 rounded-lg border border-border px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-link-form"
            disabled={createLinkMutation.isPending}
            className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            {createLinkMutation.isPending ? "Saving..." : "Save Link"}
          </button>
        </div>
      }
    >
      <form
        id="create-link-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-5"
      >
        <FormField
          label="URL"
          icon={Link2}
          placeholder="https://example.com/article"
          value={watch("url") ?? ""}
          onChange={(e) => setValue("url", e.target.value)}
          required
          error={errors.url?.message}
        />

        <FormField
          label="Title"
          icon={FileText}
          placeholder={
            fetchingMeta ? "Fetching title & icon…" : "Enter a custom title..."
          }
          value={watch("title") ?? ""}
          onChange={(e) => setValue("title", e.target.value)}
          optional
        />

        {/* Description */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">
            Description
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              (optional)
            </span>
          </Label>
          <textarea
            placeholder="Add notes about this link..."
            rows={3}
            {...register("description")}
            className="w-full resize-none rounded-lg border border-border bg-transparent px-4 py-3 text-sm text-foreground outline-none transition-all focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
          />
        </div>

        {/* Folder */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Folder className="h-4 w-4 text-primary" />
            Folder
          </Label>
          <Controller
            name="folderId"
            control={control}
            render={({ field }) => {
              const selectedFolder = folders.find((f) => f.id === field.value);
              return (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setFolderMenuOpen((v) => !v)}
                    disabled={createLinkMutation.isPending}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60",
                      folderMenuOpen && "bg-accent"
                    )}
                    aria-haspopup="menu"
                    aria-expanded={folderMenuOpen}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      {selectedFolder ? (
                        <>
                          <span className="text-base">{selectedFolder.icon}</span>
                          <span className="truncate">{selectedFolder.name}</span>
                        </>
                      ) : (
                        <>
                          <Folder className="h-3.5 w-3.5 opacity-70" />
                          <span className="text-muted-foreground">No folder</span>
                        </>
                      )}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                        folderMenuOpen && "rotate-180"
                      )}
                    />
                  </button>

                  <FolderPopover
                    open={folderMenuOpen}
                    onClose={() => setFolderMenuOpen(false)}
                  >
                    <FolderPopoverItem
                      label="No folder"
                      isActive={!field.value}
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
                    {folders.map((folder) => (
                      <FolderPopoverItem
                        key={folder.id}
                        label={folder.name}
                        emoji={folder.icon}
                        isActive={field.value === folder.id}
                        onClick={() => {
                          field.onChange(folder.id);
                          setFolderMenuOpen(false);
                        }}
                      />
                    ))}
                  </FolderPopover>
                </div>
              );
            }}
          />
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Tag className="h-4 w-4 text-primary" />
            Tags
          </Label>
          <Controller
            name="tags"
            control={control}
            render={({ field }) => (
              <TagInput
                tags={field.value ?? []}
                onChange={field.onChange}
                placeholder="Add tags…"
                disabled={createLinkMutation.isPending}
              />
            )}
          />
        </div>

        {createLinkMutation.isError && (
          <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {(createLinkMutation.error as Error)?.message ?? "Failed to save link"}
          </p>
        )}
      </form>
    </FormDialog>
  );
}