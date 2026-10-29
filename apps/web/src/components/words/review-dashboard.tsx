"use client";
import { useEffect, useState } from "react";
import { BookOpen, Plus } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useWords, useToggleMastered } from "@/hooks/use-words";
import { WordsPageSkeleton } from "@/components/shared/skeletons/page-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { WordManualDialog } from "./word-manual-dialog";
import { WordsDashboard } from "./words-dashboard";

export function ReviewDashboard() {
  const { data: words = [], isLoading, isError, error, refetch } = useWords();
  const update = useToggleMastered();
  const params = useSearchParams();
  const [manage, setManage] = useState(false), [add, setAdd] = useState(false);
  useEffect(() => { if (localStorage.getItem("stash_pending_word")) setManage(true); }, []);
  const [queue, setQueue] = useState<string[] | null>(null), [index, setIndex] = useState(0), [revealed, setRevealed] = useState(false), [known, setKnown] = useState(0), [gradeError, setGradeError] = useState("");
  if (isLoading) return <WordsPageSkeleton/>;
  if (isError) return <ErrorState message={(error as Error)?.message ?? "Failed to load words"} onRetry={() => refetch()}/>;
  if (manage || params.has("shared")) return <div className="mx-auto max-w-[1080px]"><button className="proto-link-button mb-4" onClick={() => {setManage(false); if (params.has("shared")) window.history.replaceState(null,"",window.location.pathname);}}>← Review session</button><WordsDashboard/></div>;
  const learning = words.filter(w => !w.mastered), mastered = words.filter(w => w.mastered).length;
  const ids = queue ?? learning.map(w => w.id), current = words.find(w => w.id === ids[index]);
  async function grade(isKnown: boolean) {
    setGradeError("");
    if (isKnown && current && !current.mastered) { try { await update.mutateAsync(current.id); setKnown(n => n + 1); } catch { setGradeError("Could not save your progress. Please try again."); return; } }
    setQueue(ids); setIndex(i => i + 1); setRevealed(false);
  }
  const reset = () => { setQueue(null); setIndex(0); setKnown(0); setRevealed(false); };
  return <section className="proto-review mx-auto max-w-[1080px]"><div className="proto-notebooks-head"><h1>Review session</h1><div className="flex gap-2"><button className="proto-link-button" onClick={() => setManage(true)}>Manage words</button><button className="proto-link-button primary" onClick={() => setAdd(true)}><Plus size={16}/> Add word</button></div></div><div className="proto-glance proto-notebooks-glance"><div><strong>{words.length}</strong><span>Total words</span></div><div><strong>{mastered}</strong><span>Known well</span></div><div><strong>{learning.length}</strong><span>Still learning</span></div></div><div className="proto-review-panel">{current ? <><div className="proto-review-progress"><span>Card {index + 1} of {ids.length}</span><span>{known} known</span><div><i style={{width:`${ids.length ? index / ids.length * 100 : 0}%`}}/></div></div><div className="proto-review-card"><h2>{current.word}</h2>{revealed ? <><p className="proto-review-meaning">{current.meaning || "No meaning saved yet."}</p>{current.example && <p>{current.example}</p>}</> : <p>Say the meaning out loud — then check yourself.</p>}</div>{revealed ? <div className="flex flex-wrap justify-center gap-2"><button className="proto-link-button" disabled={update.isPending} onClick={() => grade(false)}>Still learning</button><button className="proto-link-button primary" disabled={update.isPending} onClick={() => grade(true)}>{update.isPending ? "Saving…" : "I knew it"}</button></div> : <button className="proto-link-button primary" onClick={() => setRevealed(true)}>Show meaning</button>}{gradeError && <p role="alert" className="text-sm text-destructive">{gradeError}</p>}</> : <><div className="proto-review-card"><BookOpen className="mx-auto mb-4 text-primary" size={28}/><h2>{ids.length ? "Session complete" : "Ready to learn?"}</h2><p>{ids.length ? `${known} marked as known in this session.` : "Add a word to start your review."}</p></div><button className="proto-link-button primary" onClick={ids.length ? reset : () => setAdd(true)}>{ids.length ? "Review again" : "Add a word"}</button></>}</div><p className="mt-4 text-center text-sm text-muted-foreground">Review words at your own pace. Words you mark as known are saved to your account.</p><WordManualDialog open={add} onClose={() => setAdd(false)} words={words}/></section>;
}
