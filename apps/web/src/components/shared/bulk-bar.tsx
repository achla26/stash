"use client";

import { useEffect, useState } from "react";
import { Trash2, X } from "lucide-react";

interface BulkBarProps {
  selected: number;
  onDelete: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
  deleteLabel?: string;
}

/* Select-mode action bar: delete ke liye double-confirm */
export function BulkBar({
  selected,
  onDelete,
  onCancel,
  isDeleting,
  deleteLabel = "moved to trash",
}: BulkBarProps) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);

  return (
    <div className="sticky top-2 z-20 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card/95 px-3 py-2 shadow-sm backdrop-blur">
      <span className="text-xs font-semibold">
        {selected} selected
      </span>
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          disabled={selected === 0 || isDeleting}
          onClick={() => {
            if (!armed) {
              setArmed(true);
              return;
            }
            setArmed(false);
            onDelete();
          }}
          className={
            armed
              ? "inline-flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1.5 text-xs font-semibold text-white"
              : "inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-500 transition-colors hover:bg-red-500/20 disabled:opacity-40"
          }
        >
          <Trash2 className="h-3 w-3" />
          {armed
            ? `Confirm — ${selected} will be ${deleteLabel}`
            : `Delete ${selected > 0 ? `(${selected})` : ""}`}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-3 w-3" />
          Cancel
        </button>
      </div>
    </div>
  );
}
