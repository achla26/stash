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
  
  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={cn(
          "flex w-full items-center justify-between rounded-lg border px-3 py-1.5 text-xs transition-colors",
          isOpen
            ? "border-primary/40 bg-primary/5 text-primary"
            : "border-border bg-accent text-muted-foreground hover:border-primary/40 hover:text-foreground"
        )}
      >
        <div className="flex items-center gap-1.5">
          {currentFolder ? (
            <>
              <span>{currentFolder.icon}</span>
              <span className="font-medium">{currentFolder.name}</span>
            </>
          ) : (
            <>
              <Folder className="h-3 w-3" />
              <span>No collection</span>
            </>
          )}
        </div>

        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className=" left-0 top-full z-50 mt-1 w-full min-w-[180px] overflow-hidden rounded-lg border border-border bg-card shadow-lg">
          {/* Header */}
          <div className="border-b border-border px-3 py-2">
            <p className="text-xs font-medium text-muted-foreground">
              Move to collection
            </p>
          </div>

          {/* No collection */}
          <SelectOption
            label="No collection"
            icon={<Folder className="h-3.5 w-3.5 text-muted-foreground" />}
            isSelected={!currentFolderId}
            onClick={() => handleSelect(null)}
          />

          {/* Folders */}
          {folders.map((folder) => (
            <SelectOption
              key={folder.id}
              label={folder.name}
              icon={<span className="text-sm">{folder.icon}</span>}
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
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-accent",
        isSelected ? "bg-primary/5 text-primary" : "text-foreground"
      )}
    >
      {icon}
      <span className={cn(isSelected && "font-medium")}>{label}</span>
      {isSelected && <Check className="ml-auto h-3.5 w-3.5" />}
    </button>
  );
}