"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Folder, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTypeFolders } from "@/hooks/use-folder";
import { toast } from "sonner";

interface CollectionSelectProps {
  linkId: string;
  currentFolderId: string | null;
  onSelect: (folderId: string | null) => void;
}

export function CollectionSelect({
  linkId,
  currentFolderId,
  onSelect,
}: CollectionSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: folders = [] } = useTypeFolders("link");

  const currentFolder = folders.find((f) => f.id === currentFolderId);

  // Close on click outside + Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen]);

  function handleSelect(folderId: string | null) {
    onSelect(folderId);
    setIsOpen(false);

    if (folderId) {
      const folder = folders.find((f) => f.id === folderId);
      toast.success(`Moved to ${folder?.icon} ${folder?.name}`);
    } else {
      toast.success("Removed from collection");
    }
  }

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isOpen
            ? "border-primary/40 bg-primary/5 text-primary"
            : "border-border bg-accent text-muted-foreground hover:bg-accent/80 hover:text-foreground",
        )}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          {currentFolder ? (
            <>
              <span className="shrink-0 text-sm leading-none">
                {currentFolder.icon}
              </span>
              <span className="truncate font-medium">
                {currentFolder.name}
              </span>
            </>
          ) : (
            <>
              <Folder className="h-3 w-3 shrink-0 opacity-70" />
              <span className="truncate">No collection</span>
            </>
          )}
        </span>

        <ChevronDown
          className={cn(
            "h-3 w-3 shrink-0 transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute left-0 top-[calc(100%+6px)] z-50 min-w-[200px] overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-2.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Move to collection
          </div>

          {/* No collection */}
          <SelectOption
            label="No collection"
            icon={<Folder className="h-3.5 w-3.5 opacity-70" />}
            isSelected={!currentFolderId}
            onClick={() => handleSelect(null)}
          />

          {/* Folders */}
          {folders.length > 0 && (
            <div className="px-2.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Collections
            </div>
          )}
          {folders.map((folder) => (
            <SelectOption
              key={folder.id}
              label={folder.name}
              icon={<span className="text-base leading-none">{folder.icon}</span>}
              isSelected={currentFolderId === folder.id}
              onClick={() => handleSelect(folder.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ===== Select Option ===== */

function SelectOption({
  label,
  icon,
  isSelected,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onClick();
      }}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isSelected && "bg-accent",
      )}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">
        {icon}
      </span>
      <span className={cn("min-w-0 flex-1 truncate", isSelected && "font-medium")}>
        {label}
      </span>
      {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
    </button>
  );
}