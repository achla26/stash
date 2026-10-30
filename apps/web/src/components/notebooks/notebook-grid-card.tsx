import Link from "next/link";
import { FileText, Folder, Pencil, Pin, Trash2 } from "lucide-react";
import type { NotebookWithCounts } from "@repo/contracts/types";
import { ItemIcon } from "@/components/shared/item-icon";
import { Card } from "@/components/ui/card";
import { IconButton } from "@/components/ui/icon-button";
import { timeAgo } from "@/utils";

export function NotebookGridCard({
  notebook,
  onPin,
  onEdit,
  onDelete,
}: {
  notebook: NotebookWithCounts;
  onPin: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const color = /^#[0-9a-f]{6}$/i.test(notebook.coverColor || "")
    ? notebook.coverColor
    : "#4F3DE8";
  return (
    <Card
      as="article"
      className="relative rounded-[var(--radius-dialog)] hover:shadow-sm"
    >
      <span
        className="absolute bottom-[18px] left-0 top-[18px] w-1 rounded-r"
        style={{ backgroundColor: color }}
      />
      <div className="absolute right-2.5 top-2.5 z-[1] flex gap-0.5">
        <IconButton
          label={`${notebook.isPinned ? "Unpin" : "Pin"} ${notebook.name}`}
          aria-pressed={notebook.isPinned}
          onClick={onPin}
        >
          <Pin size={15} className={notebook.isPinned ? "text-primary" : ""} />
        </IconButton>
        <IconButton label={`Edit ${notebook.name}`} onClick={onEdit}>
          <Pencil size={15} />
        </IconButton>
        <IconButton label={`Delete ${notebook.name}`} onClick={onDelete}>
          <Trash2 size={15} />
        </IconButton>
      </div>
      <Link
        href={`/notebooks/${notebook.id}`}
        className="flex min-h-[196px] min-w-0 flex-col p-[18px]"
      >
        <span
          className="mb-[13px] grid h-[46px] w-[46px] place-items-center rounded-[11px]"
          style={{ backgroundColor: `${color}22`, color }}
        >
          <ItemIcon value={notebook.icon} fallback="book" size={23} />
        </span>
        <strong className="truncate pr-14 text-[15px] font-extrabold">
          {notebook.name}
        </strong>
        <span className="mt-1 line-clamp-2 flex-1 break-words text-[12.5px] leading-[1.55] text-muted-foreground">
          {notebook.description || "No description yet."}
        </span>
        <span className="mt-3 flex flex-wrap gap-3 text-[11.5px] font-semibold text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Folder size={12} /> {notebook.foldersCount ?? 0} folders
          </span>
          <span className="inline-flex items-center gap-1">
            <FileText size={12} /> {notebook.notesCount ?? 0} notes
          </span>
        </span>
        <span className="mt-3 flex items-center justify-between border-t border-border pt-[11px] text-[11px] text-muted-foreground">
          <span>{timeAgo(notebook.updatedAt)}</span>
          <span>Open →</span>
        </span>
      </Link>
    </Card>
  );
}
