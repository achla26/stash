"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateWord } from "@/hooks/use-words";
import type { Word } from "@repo/contracts/types";

const lab = "mb-1.5 block text-xs font-medium text-muted-foreground";

export function WordManualDialog({
  open,
  onClose,
  words,
}: {
  open: boolean;
  onClose: () => void;
  words: Word[];
}) {
  const createM = useCreateWord();
  const [word, setWord] = useState("");
  const [meaning, setMeaning] = useState("");
  const [pronunciation, setPronunciation] = useState("");
  const [partOfSpeech, setPartOfSpeech] = useState("");

  function reset() {
    setWord("");
    setMeaning("");
    setPronunciation("");
    setPartOfSpeech("");
  }

  function save() {
    const w = word.trim();
    if (!w) return;
    const dup = words.find((x) => x.word.toLowerCase() === w.toLowerCase());
    if (dup) {
      toast.error(`“${dup.word}” is already saved — update it from Edit.`);
      return;
    }
    createM.mutate(
      {
        word: w,
        meaning: meaning.trim(),
        pronunciation: pronunciation.trim(),
        partOfSpeech: partOfSpeech.trim(),
        example: "",
        synonyms: [],
      },
      {
        onSuccess: () => {
          toast.success(`“${w}” added`);
          reset();
          onClose();
        },
        onError: (e: any) => toast.error(e?.message || "Save failed"),
      }
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add manually</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <span className={lab}>Word *</span>
            <Input
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="e.g. serendipity"
            />
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
                placeholder="noun, verb…"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { reset(); onClose(); }}>
              Cancel
            </Button>
            <Button onClick={save} disabled={!word.trim() || createM.isPending}>
              {createM.isPending ? "Saving…" : "Add word"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
