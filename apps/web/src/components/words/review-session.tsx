"use client";

import { useState } from "react";
import { GraduationCap, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToggleMastered } from "@/hooks/use-words";
import type { Word } from "@repo/contracts/types";

const SESSION_MAX = 10;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]!;
    a[i] = a[j]!;
    a[j] = t;
  }
  return a;
}

const buildQueue = (words: Word[]) =>
  shuffle(words.filter((w) => !w.mastered)).slice(0, SESSION_MAX);

export function ReviewSession({
  words,
  onClose,
}: {
  words: Word[];
  onClose: () => void;
}) {
  const toggleM = useToggleMastered();
  const [queue, setQueue] = useState<Word[]>(() => buildQueue(words));
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [got, setGot] = useState(0);
  const [learning, setLearning] = useState(0);
  const [phase, setPhase] = useState<"review" | "summary">("review");

  const total = queue.length;
  const word = queue[idx];

  function advance() {
    setFlipped(false);
    if (idx + 1 >= total) setPhase("summary");
    else setIdx((i) => i + 1);
  }

  function masteredIt() {
    if (word && !word.mastered) toggleM.mutate(word.id);
    setGot((g) => g + 1);
    advance();
  }

  function restart() {
    const q = buildQueue(words);
    setQueue(q);
    setIdx(0);
    setFlipped(false);
    setGot(0);
    setLearning(0);
    setPhase(q.length ? "review" : "summary");
  }

  const remaining = words.filter((w) => !w.mastered).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-5 shadow-xl">
        {phase === "review" && word ? (
          <>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[13px] font-extrabold tracking-wider">
                REVIEW
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground">
                  Card {idx + 1} of {total}
                </span>
                <button
                  onClick={onClose}
                  aria-label="Close review"
                  className="rounded p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mb-4 flex justify-center gap-1.5">
              {queue.map((q, i) => (
                <span
                  key={q.id}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full bg-muted-foreground/25",
                    i < idx && "bg-primary",
                    i === idx && "bg-amber-400"
                  )}
                />
              ))}
            </div>

            <button
              onClick={() => setFlipped((f) => !f)}
              className="flex min-h-[240px] w-full flex-col items-center justify-center rounded-2xl border border-border bg-background p-6 text-center shadow-sm"
            >
              {!flipped ? (
                <>
                  <span className="text-3xl font-extrabold tracking-tight">
                    {word.word}
                  </span>
                  {word.pronunciation && (
                    <span className="mt-1.5 text-sm text-muted-foreground">
                      {word.pronunciation}
                    </span>
                  )}
                  {word.partOfSpeech && (
                    <span className="mt-2 rounded-full bg-accent px-2.5 py-0.5 text-[10.5px] font-bold text-muted-foreground">
                      {word.partOfSpeech}
                    </span>
                  )}
                  <span className="mt-5 text-[10px] font-extrabold tracking-[0.14em] text-muted-foreground/60">
                    TAP TO FLIP
                  </span>
                </>
              ) : (
                <>
                  <span className="max-w-[46ch] text-base leading-relaxed">
                    {word.meaning || "No meaning yet — add one from Edit."}
                  </span>
                  {word.example && (
                    <span className="mt-3 max-w-[46ch] text-[13px] italic text-muted-foreground">
                      “{word.example}”
                    </span>
                  )}
                  <span className="mt-5 text-[10px] font-extrabold tracking-[0.14em] text-muted-foreground/60">
                    TAP TO FLIP BACK
                  </span>
                </>
              )}
            </button>

            <div className="mt-4 flex gap-2.5">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setLearning((l) => l + 1);
                  advance();
                }}
              >
                Still learning
              </Button>
              <Button className="flex-1" onClick={masteredIt}>
                Mastered it
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center pb-1 text-center">
              <GraduationCap className="h-8 w-8 text-primary" />
              <span className="mt-2 text-[13px] font-extrabold tracking-wider">
                {total === 0 ? "ALL MASTERED" : "SESSION COMPLETE"}
              </span>
            </div>
            <div className="my-4 grid grid-cols-3 gap-2.5">
              <div className="rounded-xl border border-border bg-background p-3 text-center">
                <div className="text-[22px] font-extrabold">{got + learning}</div>
                <div className="text-xs text-muted-foreground">Reviewed</div>
              </div>
              <div className="rounded-xl border border-border bg-background p-3 text-center">
                <div className="text-[22px] font-extrabold text-primary">
                  {got}
                </div>
                <div className="text-xs text-muted-foreground">Mastered</div>
              </div>
              <div className="rounded-xl border border-border bg-background p-3 text-center">
                <div className="text-[22px] font-extrabold">{learning}</div>
                <div className="text-xs text-muted-foreground">
                  Still learning
                </div>
              </div>
            </div>
            <div className="flex justify-center gap-2.5">
              <Button variant="outline" onClick={onClose}>
                Done
              </Button>
              {remaining > 0 && (
                <Button onClick={restart}>Review remaining {remaining}</Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
