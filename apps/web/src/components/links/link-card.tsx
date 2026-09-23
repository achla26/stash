"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  Copy,
  Pencil,
  Pin,
  PinOff,
  RefreshCw,
  Trash2,
  Globe,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/utils";
import { CollectionSelect } from "./collection-select";
import type { Link } from "@repo/contracts/types";

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

interface LinkCardProps {
  link: Link;
  onDelete: () => void;
  onEdit?: () => void;
  onPin?: () => void;
  onRefresh?: () => void;
  onMoveToFolder?: (folderId: string | null) => void;
  isDeleting?: boolean;
  isPinning?: boolean;
  isRefreshing?: boolean;
}

export function LinkCard({
  link,
  onDelete,
  onEdit,
  onPin,
  onRefresh,
  onMoveToFolder,
  isDeleting = false,
  isPinning = false,
  isRefreshing = false,
}: LinkCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-primary hover:shadow-md",
        (isDeleting || isPinning) && "pointer-events-none opacity-50"
      )}
    >
      {link.isPinned && <PinBadge />}

      <PreviewImage
        image={link.image}
        favicon={link.favicon}
        url={link.url}
        title={link.title}
        imgError={imgError}
        onImgError={() => setImgError(true)}
      />

      <div className="flex flex-1 flex-col p-4">
        <SiteInfo favicon={link.favicon} url={link.url} />

        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
          {link.title || getDomain(link.url)}
        </h3>

        {link.description && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted-foreground">
            {link.description}
          </p>
        )}

        {link.tags.length > 0 && <TagList tags={link.tags} />}

        {onMoveToFolder && (
          <div className="mt-3" onClick={(e) => e.stopPropagation()}>
            <CollectionSelect
              linkId={link.id}
              currentFolderId={link.folderId ?? null}
              onSelect={onMoveToFolder}
            />
          </div>
        )}

        <div className="mt-auto pt-3">
          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="text-xs text-muted-foreground">
              {timeAgo(link.createdAt)}
            </span>

            <ActionButtons
              link={link}
              onEdit={onEdit}
              onDelete={onDelete}
              onPin={onPin}
              onRefresh={onRefresh}
              isRefreshing={isRefreshing}
            />
          </div>

          {link.shortCode && (
            <ShortUrlTab shortCode={link.shortCode} />
          )}
        </div>
      </div>
    </div>
  );
}

function PinBadge() {
  return (
    <div className="absolute right-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
      <Pin className="h-3 w-3" />
    </div>
  );
}

function PreviewImage({
  image,
  favicon,
  url,
  title,
  imgError,
  onImgError,
}: {
  image?: string | null;
  favicon?: string | null;
  url: string;
  title?: string | null;
  imgError: boolean;
  onImgError: () => void;
}) {
  if (image && !imgError) {
    return (
      <div className="relative h-36 overflow-hidden bg-accent">
        <img
          src={image}
          alt={title ?? "Link preview"}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={onImgError}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-20 items-center justify-center bg-accent">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-card">
        {favicon ? (
          <img
            src={favicon}
            alt=""
            className="h-5 w-5 rounded-sm"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <span className="text-lg font-bold text-primary">
            {getDomain(url).charAt(0).toUpperCase()}
          </span>
        )}
      </div>
    </div>
  );
}

function SiteInfo({
  favicon,
  url,
}: {
  favicon?: string | null;
  url: string;
}) {
  return (
    <div className="mb-2 flex items-center gap-2">
      {favicon ? (
        <img
          src={favicon}
          alt=""
          className="h-4 w-4 rounded-sm"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <Globe className="h-4 w-4 text-muted-foreground" />
      )}
      <span className="truncate text-xs text-muted-foreground">
        {getDomain(url)}
      </span>
    </div>
  );
}

function TagList({ tags }: { tags: string[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center rounded-full border border-border bg-accent px-2 py-0.5 text-xs font-medium text-muted-foreground"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

function ActionButtons({
  link,
  onEdit,
  onDelete,
  onPin,
  onRefresh,
  isRefreshing,
}: {
  link: Link;
  onEdit?: () => void;
  onDelete: () => void;
  onPin?: () => void;
  onRefresh?: () => void;
  isRefreshing: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
      {link.shortCode && (
        <ActionButton
          icon={Copy}
          title="Copy short link"
          onClick={(e) => {
            e.stopPropagation();
            const shortUrl = `${window.location.origin}/s/${link.shortCode}`;
            navigator.clipboard.writeText(shortUrl);
            toast.success("Short link copied");
          }}
        />
      )}

      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        title="Open link"
        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <ArrowUpRight className="h-3.5 w-3.5" />
      </a>

      {onEdit && (
        <ActionButton
          icon={Pencil}
          title="Edit link"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        />
      )}

      {onRefresh && (
        <ActionButton
          icon={RefreshCw}
          title="Refresh preview"
          disabled={isRefreshing}
          spinning={isRefreshing}
          onClick={(e) => {
            e.stopPropagation();
            onRefresh();
          }}
        />
      )}

      {onPin && (
        <ActionButton
          icon={link.isPinned ? PinOff : Pin}
          title={link.isPinned ? "Unpin" : "Pin"}
          onClick={(e) => {
            e.stopPropagation();
            onPin();
          }}
        />
      )}

      <ActionButton
        icon={Trash2}
        title="Delete link"
        variant="destructive"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      />
    </div>
  );
}

function ActionButton({
  icon: Icon,
  title,
  onClick,
  variant = "default",
  disabled = false,
  spinning = false,
}: {
  icon: React.ElementType;
  title: string;
  onClick: (e: React.MouseEvent) => void;
  variant?: "default" | "destructive";
  disabled?: boolean;
  spinning?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-lg transition-colors disabled:opacity-50",
        variant === "destructive"
          ? "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", spinning && "animate-spin")} />
    </button>
  );
}

function ShortUrlTab({ shortCode }: { shortCode: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const shortUrl = `${window.location.origin}/s/${shortCode}`;
    navigator.clipboard.writeText(shortUrl).then(() => {
      setCopied(true);
      toast.success("Short link copied");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "mt-2 flex w-full items-center justify-between rounded-lg border px-3 py-1.5 transition-colors",
        copied
          ? "border-success/30 bg-success/5"
          : "border-border bg-accent hover:border-primary/40 hover:bg-primary/5"
      )}
    >
      <span
        className={cn(
          "font-mono text-xs",
          copied ? "text-success" : "text-muted-foreground"
        )}
      >
        /s/{shortCode}
      </span>
      {copied ? (
        <Check className="h-3 w-3 text-success" />
      ) : (
        <Copy className="h-3 w-3 text-muted-foreground" />
      )}
    </button>
  );
}