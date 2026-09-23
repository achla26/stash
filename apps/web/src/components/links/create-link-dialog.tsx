"use client";

import { Link2, FileText, Folder, Tag } from "lucide-react";
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

interface CreateLinkDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

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
            className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-link-form"
            disabled={createLinkMutation.isPending}
            className="flex-1 rounded-xl px-4 py-3 text-sm font-medium text-white gradient-button disabled:opacity-50"
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
          placeholder={fetchingMeta ? "Fetching title & icon…" : "Enter a custom title..."}
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
            className="w-full resize-none rounded-xl border border-border bg-transparent px-4 py-3 text-sm text-foreground outline-none transition-all focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
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
            render={({ field }) => (
              <select
                value={field.value ?? "none"}
                onChange={(e) =>
                  field.onChange(e.target.value === "none" ? null : e.target.value)
                }
                disabled={createLinkMutation.isPending}
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition-colors focus:ring-2 focus:ring-ring disabled:opacity-60"
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