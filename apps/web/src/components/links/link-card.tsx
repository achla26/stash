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
  Link2,
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
        "card-lift group relative flex flex-col rounded-xl border border-border bg-card",
        (isDeleting || isPinning) && "pointer-events-none opacity-50",
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
        {/* Site info */}
        <SiteInfo favicon={link.favicon} url={link.url} />

        {/* Title */}
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
          {link.title || getDomain(link.url)}
        </h3>

        {/* Description */}
        {link.description && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted-foreground">
            {link.description}
          </p>
        )}

        {/* Tags */}
        {link.tags.length > 0 && <TagList tags={link.tags} />}

        {/* Collection */}
        {onMoveToFolder && (
          <div className="mt-3" onClick={(e) => e.stopPropagation()}>
            <CollectionSelect
              linkId={link.id}
              currentFolderId={link.folderId ?? null}
              onSelect={onMoveToFolder}
            />
          </div>
        )}

        {/* Footer */}
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

          {link.shortCode && <ShortUrlTab shortCode={link.shortCode} />}
        </div>
      </div>
    </div>
  );
}

/* ===== Pin badge ===== */

function PinBadge() {
  return (
    <div className="absolute right-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_4px_12px_var(--primary-glow)]">
      <Pin className="h-3 w-3" />
    </div>
  );
}

/* ===== Preview image ===== */

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
      <div className="relative h-40 overflow-hidden bg-accent">
        <img
          src={image}
          alt={title ?? "Link preview"}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={onImgError}
        />
        {/* Soft gradient to keep contrast */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card/60 to-transparent" />
      </div>
    );
  }

  // Fallback — big letter tile, no plain gray box
  const domain = getDomain(url);
  const letter = domain.charAt(0).toUpperCase();

  return (
    <div className="relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br from-accent to-accent/60">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card shadow-sm"
        aria-hidden
      >
        {favicon ? (
          <img
            src={favicon}
            alt=""
            className="h-8 w-8 rounded-sm"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <span className="text-2xl font-bold text-primary">{letter}</span>
        )}
      </div>
      {!favicon && !letter && (
        <Link2 className="absolute h-5 w-5 text-muted-foreground" />
      )}
    </div>
  );
}

/* ===== Site info ===== */

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
          className="h-3.5 w-3.5 rounded-sm"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
      )}
      <span className="truncate text-xs text-muted-foreground">
        {getDomain(url)}
      </span>
    </div>
  );
}

/* ===== Tags ===== */

function TagList({ tags }: { tags: string[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {tags.slice(0, 3).map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
        >
          {tag}
        </span>
      ))}
      {tags.length > 3 && (
        <span className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          +{tags.length - 3}
        </span>
      )}
    </div>
  );
}

/* ===== Action buttons ===== */

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
    <div className="flex flex-wrap items-center justify-end gap-0.5 opacity-100 transition-opacity duration-150 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
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
        aria-label="Open link"
        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
        variant === "destructive"
          ? "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", spinning && "animate-spin")} />
    </button>
  );
}

/* ===== Short URL tab ===== */

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
      type="button"
      onClick={handleCopy}
      className={cn(
        "mt-3 flex w-full items-center justify-between rounded-lg px-3 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        copied
          ? "bg-success/10"
          : "bg-accent hover:bg-accent/80",
      )}
      aria-label="Copy short link"
    >
      <span
        className={cn(
          "font-mono text-[11px]",
          copied ? "text-success" : "text-muted-foreground",
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