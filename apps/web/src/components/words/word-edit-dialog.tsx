"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUpdateWord } from "@/hooks/use-words";
import type { Word } from "@repo/contracts/types";

interface Props {
  word: Word | null;
  isOpen: boolean;
  onClose: () => void;
}

export function WordEditDialog({ word, isOpen, onClose }: Props) {
  const updateM = useUpdateWord();

  const [meaning, setMeaning] = useState("");
  const [pronunciation, setPronunciation] = useState("");
  const [partOfSpeech, setPartOfSpeech] = useState("");
  const [example, setExample] = useState("");
  const [book, setBook] = useState("");
  const [page, setPage] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!word) return;
    setMeaning(word.meaning ?? "");
    setPronunciation(word.pronunciation ?? "");
    setPartOfSpeech(word.partOfSpeech ?? "");
    setExample(word.example ?? "");
    setBook(word.book ?? "");
    setPage(word.page != null ? String(word.page) : "");
    setNote(word.note ?? "");
  }, [word, isOpen]);

  if (!word) return null;

  function save() {
    if (!word) return;
    const pageNum = parseInt(page, 10);
    updateM.mutate(
      {
        id: word.id,
        meaning,
        pronunciation,
        partOfSpeech,
        example,
        book: book.trim() || null,
        page: !isNaN(pageNum) && pageNum > 0 ? pageNum : null,
        note,
      },
      {
        onSuccess: () => {
          toast.success("Word updated");
          onClose();
        },
        onError: (e: any) => toast.error(e?.message || "Update failed"),
      }
    );
  }

  const lab = "mb-1.5 block text-xs font-medium text-muted-foreground";

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* word name locked */}
          <div>
            <span className={lab}>Word (locked)</span>
            <div className="rounded-md border border-border bg-accent px-3 py-2 text-sm font-semibold text-muted-foreground">
              {word.word}
            </div>
          </div>

          <div>
            <span className={lab}>Meaning</span>
            <textarea
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              placeholder="Meaning…"
              className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className={lab}>Pronunciation</span>
              <Input
                value={pronunciation}
                onChange={(e) => setPronunciation(e.target.value)}
                placeholder="/…/"
              />
            </div>
            <div>
              <span className={lab}>Part of speech</span>
              <Input
                value={partOfSpeech}
                onChange={(e) => setPartOfSpeech(e.target.value)}
                placeholder="noun / verb…"
              />
            </div>
          </div>

          <div>
            <span className={lab}>Example sentence</span>
            <Input
              value={example}
              onChange={(e) => setExample(e.target.value)}
              placeholder="Example…"
            />
          </div>

          <div className="grid grid-cols-[1fr_90px] gap-3">
            <div>
              <span className={lab}>Book</span>
              <Input
                value={book}
                onChange={(e) => setBook(e.target.value)}
                placeholder="Book name"
              />
            </div>
            <div>
              <span className={lab}>Page</span>
              <Input
                value={page}
                onChange={(e) => setPage(e.target.value.replace(/\D/g, ""))}
                placeholder="42"
                inputMode="numeric"
              />
            </div>
          </div>

          <div>
            <span className={lab}>Personal note / Hinglish meaning</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Apni bhasha me samjho…"
              className="min-h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={save} disabled={updateM.isPending}>
              {updateM.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
