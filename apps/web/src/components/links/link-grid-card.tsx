import { ExternalLink, Pencil, Pin, Trash2 } from "lucide-react";
import type { Link as SavedLink } from "@repo/contracts/types";
import { Card } from "@/components/ui/card";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";

export function LinkGridCard({
  link,
  folderName,
  list,
  onPin,
  onEdit,
  onDelete,
  onTag,
}: {
  link: SavedLink;
  folderName?: string;
  list: boolean;
  onPin: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTag: (tag: string) => void;
}) {
  let host = link.url;
  try {
    host = new URL(link.url).hostname.replace(/^www\./, "");
  } catch {
    /* Preserve invalid saved URLs as text. */
  }
  const badge =
    "rounded-full border border-border bg-accent px-[9px] py-0.5 text-[11px] font-bold text-muted-foreground";
  return (
    <Card
      as="article"
      className={cn(
        "relative flex flex-col gap-2.5 rounded-[var(--radius-dialog)] p-4 break-words hover:-translate-y-0.5 hover:shadow-sm",
        list && "flex-row flex-wrap items-center gap-3.5 py-3",
      )}
    >
      <div className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[9px] bg-primary/10 text-[15px] font-extrabold text-primary">
          {(link.title || host).charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-semibold text-muted-foreground">
            {host}
          </span>
          <span className="block truncate text-[11px] text-muted-foreground">
            {new Date(link.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </span>
        <div className="ml-auto flex gap-0.5">
          <IconButton
            label={link.isPinned ? "Unpin link" : "Pin link"}
            aria-pressed={link.isPinned}
            onClick={onPin}
          >
            <Pin size={16} className={link.isPinned ? "text-primary" : ""} />
          </IconButton>
          <IconButton label="Edit link" onClick={onEdit}>
            <Pencil size={16} />
          </IconButton>
          <IconButton label="Move link to trash" onClick={onDelete}>
            <Trash2 size={16} />
          </IconButton>
        </div>
      </div>
      <div className="min-w-0 flex-1 break-words">
        <a
          className="text-sm font-bold leading-[1.4] hover:text-primary"
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {link.title || host} <ExternalLink size={13} className="inline" />
        </a>
        {link.description && (
          <p className="mt-1 text-xs text-muted-foreground">
            {link.description}
          </p>
        )}
      </div>
      <div className="mt-auto flex flex-wrap gap-[5px]">
        {folderName && <span className={badge}>{folderName}</span>}
        {link.tags.map((tag) => (
          <button key={tag} className={badge} onClick={() => onTag(tag)}>
            #{tag}
          </button>
        ))}
      </div>
    </Card>
  );
}
