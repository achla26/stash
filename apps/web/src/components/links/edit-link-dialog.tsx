"use client";

import { Link2, FileText, Folder, Tag } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";

import { updateLinkSchema, type UpdateLinkInput } from "@repo/contracts/schemas";
import { type Link } from "@repo/contracts/types";

import { useUpdateLink } from "@/hooks/use-links";
import { useTypeFolders } from "@/hooks/use-folder";
import { TagInput } from "./tag-input";
import { Label } from "@/components/ui/label";
import { FormDialog } from "@/components/ui/form-dialog";
import FormField from "../ui/form-field";
import { cn } from "@/lib/utils";

interface EditLinkDialogProps {
  link: Link | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditLinkDialog({
  link,
  isOpen,
  onClose,
}: EditLinkDialogProps) {
  const updateLinkMutation = useUpdateLink();
  const { data: folders = [] } = useTypeFolders("link");

  const {
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UpdateLinkInput>({
    resolver: zodResolver(updateLinkSchema),
    defaultValues: {
      url: "",
      title: "",
      description: "",
      folderId: null,
      tags: [],
    },
  });

  useEffect(() => {
  if (link && isOpen) {
    reset({
      url: link.url,
      title: link.title ?? "",
      description: link.description ?? "",
      folderId: link.folderId ?? null,  
      tags: link.tags ?? [],
    });
  }
}, [link, isOpen, reset]);

  function onSubmit(values: UpdateLinkInput) {
    if (!link) return;

    updateLinkMutation.mutate(
      {
        id: link.id,
        ...values,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  }

  function handleClose() {
    reset();
    onClose();
  }

  if (!link) return null;

  return (
    <FormDialog
      open={isOpen}
      onClose={handleClose}
      title="Edit Link"
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
            form="edit-link-form"
            disabled={updateLinkMutation.isPending}
            className="flex-1 rounded-xl px-4 py-3 text-sm font-medium text-white gradient-button disabled:opacity-50"
          >
            {updateLinkMutation.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      }
    >
      <form
        id="edit-link-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-5"
      >
        {/* URL */}
        <FormField
          label="URL"
          icon={Link2}
          placeholder="https://example.com"
          value={watch("url") ?? ""}
          onChange={(e) => setValue("url", e.target.value)}
          required
          error={errors.url?.message}
        />

        {/* Title */}
        <FormField
          label="Title"
          icon={FileText}
          placeholder="Enter a custom title..."
          value={watch("title") ?? ""}
          onChange={(e) => setValue("title", e.target.value)}
          optional
        />

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Description
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              (optional)
            </span>
          </label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <textarea
                placeholder="Add notes about this link..."
                rows={3}
                value={field.value ?? ""}
                onChange={field.onChange}
                className="w-full resize-none rounded-xl border border-border bg-transparent px-4 py-3 text-sm text-foreground outline-none transition-all focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
              />
            )}
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
                  field.onChange(
                    e.target.value === "none" ? null : e.target.value
                  )
                }
                disabled={updateLinkMutation.isPending}
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
                disabled={updateLinkMutation.isPending}
              />
            )}
          />
        </div>

        {/* API Error */}
        {updateLinkMutation.isError && (
          <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {(updateLinkMutation.error as Error)?.message ??
              "Failed to update link"}
          </p>
        )}
      </form>
    </FormDialog>
  );
}