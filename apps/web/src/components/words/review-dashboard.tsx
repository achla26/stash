"use client";

import { useEffect, useState } from "react";
import { BookOpen, Plus } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useWords, useToggleMastered } from "@/hooks/use-words";
import { WordsPageSkeleton } from "@/components/shared/skeletons/page-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { StatStrip } from "@/components/shared/stat-strip";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Page, SectionHeader } from "@/components/ui/layout";
import { WordManualDialog } from "./word-manual-dialog";
import { WordsDashboard } from "./words-dashboard";
import { ReviewProgress } from "./review-progress";
import { ReviewCard } from "./review-card";

export function ReviewDashboard() {
  const { data: words = [], isLoading, isError, error, refetch } = useWords();
  const update = useToggleMastered();
  const params = useSearchParams();
  const [manage, setManage] = useState(false);
  const [add, setAdd] = useState(false);
  const [queue, setQueue] = useState<string[] | null>(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [known, setKnown] = useState(0);
  const [gradeError, setGradeError] = useState("");

  useEffect(() => {
    if (localStorage.getItem("stash_pending_word")) setManage(true);
  }, []);

  if (isLoading) return <WordsPageSkeleton />;
  if (isError)
    return (
      <ErrorState
        message={(error as Error)?.message ?? "Failed to load words"}
        onRetry={() => refetch()}
      />
    );
  if (manage || params.has("shared")) {
    return (
      <Page>
        <Button
          variant="outline"
          className="mb-4"
          onClick={() => {
            setManage(false);
            if (params.has("shared"))
              window.history.replaceState(null, "", window.location.pathname);
          }}
        >
          ← Review session
        </Button>
        <WordsDashboard />
      </Page>
    );
  }

  const learning = words.filter((word) => !word.mastered);
  const mastered = words.filter((word) => word.mastered).length;
  const ids = queue ?? learning.map((word) => word.id);
  const current = words.find((word) => word.id === ids[index]);

  async function grade(isKnown: boolean) {
    setGradeError("");
    if (isKnown && current && !current.mastered) {
      try {
        await update.mutateAsync(current.id);
        setKnown((value) => value + 1);
      } catch {
        setGradeError("Could not save your progress. Please try again.");
        return;
      }
    }
    setQueue(ids);
    setIndex((value) => value + 1);
    setRevealed(false);
  }

  function reset() {
    setQueue(null);
    setIndex(0);
    setKnown(0);
    setRevealed(false);
  }

  return (
    <Page>
      <SectionHeader
        heading="h1"
        title="Review session"
        actions={
          <>
            <Button variant="outline" onClick={() => setManage(true)}>
              Manage words
            </Button>
            <Button onClick={() => setAdd(true)}>
              <Plus size={16} /> Add word
            </Button>
          </>
        }
      />
      <StatStrip
        items={[
          { label: "Total words", value: words.length },
          { label: "Known well", value: mastered },
          { label: "Still learning", value: learning.length },
        ]}
      />
      <Card className="flex flex-col items-center gap-[18px] px-5 py-[26px] text-center">
        {current ? (
          <>
            <ReviewProgress index={index} total={ids.length} known={known} />
            <ReviewCard title={current.word}>
              {revealed ? (
                <>
                  <p className="mt-3 text-base font-semibold text-foreground">
                    {current.meaning || "No meaning saved yet."}
                  </p>
                  {current.example && (
                    <p className="mt-3 text-[13.5px] text-muted-foreground">
                      {current.example}
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-3 text-[13.5px] text-muted-foreground">
                  Say the meaning out loud — then check yourself.
                </p>
              )}
            </ReviewCard>
            {revealed ? (
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  variant="outline"
                  disabled={update.isPending}
                  onClick={() => grade(false)}
                >
                  Still learning
                </Button>
                <Button disabled={update.isPending} onClick={() => grade(true)}>
                  {update.isPending ? "Saving…" : "I knew it"}
                </Button>
              </div>
            ) : (
              <Button onClick={() => setRevealed(true)}>Show meaning</Button>
            )}
            {gradeError && (
              <p role="alert" className="text-sm text-destructive">
                {gradeError}
              </p>
            )}
          </>
        ) : (
          <>
            <ReviewCard
              title={ids.length ? "Session complete" : "Ready to learn?"}
              icon={
                <BookOpen className="mx-auto mb-4 text-primary" size={28} />
              }
            >
              <p className="mt-3 text-[13.5px] text-muted-foreground">
                {ids.length
                  ? `${known} marked as known in this session.`
                  : "Add a word to start your review."}
              </p>
            </ReviewCard>
            <Button onClick={ids.length ? reset : () => setAdd(true)}>
              {ids.length ? "Review again" : "Add a word"}
            </Button>
          </>
        )}
      </Card>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Review words at your own pace. Words you mark as known are saved to your
        account.
      </p>
      <WordManualDialog
        open={add}
        onClose={() => setAdd(false)}
        words={words}
      />
    </Page>
  );
}
