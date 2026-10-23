"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, RotateCcw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { bulkService, trashService } from "@/lib/services";
import { BulkBar } from "@/components/shared/bulk-bar";

/* Trash view: deleted notes yahan milti hain — restore ya permanent delete */
export function NotesTrash({ onBack }: { onBack: () => void }) {
  const queryClient = useQueryClient();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["notes", "trash"],
    queryFn: trashService.notes,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["notes"] });
    queryClient.invalidateQueries({ queryKey: ["notes", "trash"] });
  };

  const restoreMutation = useMutation({
    mutationFn: (id: string) => trashService.restoreNote(id),
    onSuccess: () => {
      toast.success("Note restored");
      invalidate();
    },
    onError: () => toast.error("Restore failed"),
  });

  const bulkPermanentMutation = useMutation({
    mutationFn: (ids: string[]) => bulkService.notesPermanent(ids),
    onSuccess: (_r, ids) => {
      toast.success(`${ids.length} ${"note"}s deleted permanently`);
      setSelectMode(false);
      setSelectedIds([]);
      invalidate();
    },
    onError: () => toast.error("Bulk delete failed"),
  });

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const permanentMutation = useMutation({
    mutationFn: (id: string) => trashService.deleteNoteForever(id),
    onSuccess: () => {
      toast.success("Note deleted permanently");
      setConfirmId(null);
      invalidate();
    },
    onError: () => toast.error("Delete failed"),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to notes
        </button>
        <div className="ml-auto">
          {!selectMode ? (
            <button
              type="button"
              onClick={() => setSelectMode(true)}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              Select
            </button>
          ) : null}
        </div>
        <h2 className="text-sm font-bold">Trash ({notes.length})</h2>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-accent" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          Trash is empty — deleted notes will appear here.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {selectMode && (
            <BulkBar
              selected={selectedIds.length}
              isDeleting={bulkPermanentMutation.isPending}
              deleteLabel="deleted permanently"
              onDelete={() => bulkPermanentMutation.mutate(selectedIds)}
              onCancel={() => {
                setSelectMode(false);
                setSelectedIds([]);
              }}
            />
          )}
          {notes.map((n: any) => (
            <div
              key={n.id}
              onClick={selectMode ? () => toggleSelect(n.id) : undefined}
              className={cn(
                "flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3",
                selectMode && "cursor-pointer",
                selectedIds.includes(n.id) && "ring-2 ring-primary"
              )}
            >
              {selectMode && (
                <span
                  className={
                    selectedIds.includes(n.id)
                      ? "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-white"
                      : "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border"
                  }
                >
                  {selectedIds.includes(n.id) && <Check className="h-3 w-3" />}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {n.title || "Untitled"}
                </p>
                <p className="text-xs text-muted-foreground">
                  deleted{" "}
                  {new Date(n.updatedAt ?? n.createdAt).toLocaleDateString(
                    undefined,
                    { month: "short", day: "numeric" }
                  )}
                </p>
              </div>
              {!selectMode && (
                <>
              <button
                type="button"
                disabled={restoreMutation.isPending}
                onClick={() => restoreMutation.mutate(n.id)}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
              >
                <RotateCcw className="h-3 w-3" />
                Restore
              </button>
              <button
                type="button"
                disabled={permanentMutation.isPending}
                onClick={() => {
                  if (confirmId !== n.id) {
                    setConfirmId(n.id);
                    setTimeout(
                      () => setConfirmId((c) => (c === n.id ? null : c)),
                      3000
                    );
                    return;
                  }
                  permanentMutation.mutate(n.id);
                }}
                className={
                  confirmId === n.id
                    ? "inline-flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1.5 text-xs font-semibold text-white"
                    : "inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-500 transition-colors hover:bg-red-500/20"
                }
              >
                <Trash2 className="h-3 w-3" />
                {confirmId === n.id ? "Confirm?" : "Delete forever"}
              </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
