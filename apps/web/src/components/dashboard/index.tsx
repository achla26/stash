"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { BookOpen, FileCode, FileText, Link2, Plus, Zap, Chrome } from "lucide-react";
import { useDashboard } from "@/hooks/use-dashboard";
import { useAuth } from "@/hooks/use-auth";
import { useWords } from "@/hooks/use-words";
import { useCreateLink } from "@/hooks/use-links";
import { useCreateNote } from "@/hooks/use-notes";
import { DashboardSkeleton } from "@/components/shared/skeletons/page-skeleton";
import { timeAgo } from "@/utils";
import type { RecentItem } from "@repo/contracts/types";

const icons: Record<string, React.ElementType> = { note: FileText, link: Link2, notebook: BookOpen, page: FileCode };
function itemHref(item: RecentItem) {
  if (item.type === "note") return `/notes/${item.id}`;
  if (item.type === "notebook") return `/notebooks/${item.id}`;
  if (item.type === "page") return "/notebooks";
  return "/links";
}
function asUrl(value: string): string | null {
  if (/\s/.test(value)) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    return (url.protocol === "https:" || url.protocol === "http:") && url.hostname.includes(".") ? url.href : null;
  } catch { return null; }
}

export function DashboardContent() {
  const { getUser } = useAuth();
  const { data, isLoading, isError, refetch } = useDashboard();
  const { data: words, isError: wordsError } = useWords();
  const createLink = useCreateLink();
  const createNote = useCreateNote();
  const [capture, setCapture] = useState("");
  const [message, setMessage] = useState("");
  const [captureError, setCaptureError] = useState("");
  if (isLoading) return <DashboardSkeleton />;
  const items = data?.recentItems ?? [];
  const firstName = getUser()?.name?.trim().split(/\s+/)[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const wordCount = words?.filter(w => !w.mastered).length;
  const cards = [
    { label: "Notes", count: data?.stats.totalNotes, href: "/notes" },
    { label: "Links", count: data?.stats.totalLinks, href: "/links" },
    { label: "Notebooks", count: data?.stats.totalNotebooks, href: "/notebooks" },
    { label: "Words to review", count: wordsError ? undefined : wordCount, href: "/words" },
  ];
  async function handleCapture(e: FormEvent) {
    e.preventDefault();
    const value = capture.trim();
    if (!value) { window.dispatchEvent(new Event("stash:capture")); return; }
    setCaptureError(""); setMessage("");
    try {
      const url = asUrl(value);
      if (url) await createLink.mutateAsync({ url, title: undefined, description: undefined, tags: [] });
      else await createNote.mutateAsync({ title: value.slice(0, 200), content: value });
      setCapture(""); setMessage(url ? "Link saved to your stash." : "Note saved to your stash.");
    } catch (error) { setCaptureError(error instanceof Error ? error.message : "Could not save. Please try again."); }
  }
  const busy = createLink.isPending || createNote.isPending;
  return <div className="mx-auto w-full min-w-0 max-w-[1080px] text-sm text-foreground">
    <div className="mb-[22px] mt-0.5 flex items-start justify-between gap-6 [&_h1]:font-serif [&_h1]:text-[clamp(25px,3.4vw,32px)] [&_h1]:font-bold [&_h1]:leading-[1.25] [&_h1]:tracking-[-.01em] [&_p]:mt-[7px] [&_p]:text-[14.5px] [&_p]:text-muted-foreground"><div><h1>{greeting}, {firstName}.</h1><p>Pick up where you left off.</p></div><div className="hidden shrink-0 pt-1.5 text-right md:block [&_strong]:block [&_strong]:text-[13.5px] [&_span]:mt-[3px] [&_span]:block [&_span]:text-[9.5px] [&_span]:font-extrabold [&_span]:tracking-[.14em] [&_span]:text-muted-foreground"><strong>{new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date())}</strong><span>STASH · DASHBOARD</span></div></div>
    <form className="mb-2 flex items-center gap-2.5 rounded-[14px] border-[1.5px] border-border bg-card py-[7px] pl-4 pr-[7px] text-muted-foreground focus-within:border-muted-foreground [&_input]:min-w-0 [&_input]:flex-1 [&_input]:border-0 [&_input]:bg-transparent [&_input]:py-[9px] [&_input]:text-[15px] [&_input]:text-foreground [&_input]:outline-none [&_kbd]:hidden [&_kbd]:rounded-[5px] [&_kbd]:border [&_kbd]:border-b-2 [&_kbd]:border-border [&_kbd]:bg-accent [&_kbd]:px-1.5 [&_kbd]:py-px [&_kbd]:text-[10.5px] md:[&_kbd]:block [&_button]:inline-flex [&_button]:min-h-10 [&_button]:items-center [&_button]:gap-0 [&_button]:rounded-[9px] [&_button]:bg-primary [&_button]:px-[17px] [&_button]:py-2.5 [&_button]:text-[0px] [&_button]:font-bold [&_button]:text-primary-foreground [&_button:disabled]:opacity-60 md:[&_button]:gap-[7px] md:[&_button]:text-[13.5px]" onSubmit={handleCapture}><Plus size={19} aria-hidden="true" /><label className="sr-only" htmlFor="quick-capture">Paste a link or type a note</label><input id="quick-capture" value={capture} onChange={e => setCapture(e.target.value)} placeholder="Paste a link, or just start typing a note…" autoComplete="off" /><kbd>↵ to save</kbd><button type="submit" disabled={busy}><Zap size={16} /> {busy ? "Saving…" : "Capture"}</button></form>
    <p className="mb-[22px] px-1 text-xs text-muted-foreground [&_kbd]:whitespace-nowrap [&_kbd]:rounded-[5px] [&_kbd]:border [&_kbd]:border-b-2 [&_kbd]:border-border [&_kbd]:bg-accent [&_kbd]:px-1.5 [&_kbd]:py-px [&_kbd]:text-[10.5px]">Links are detected automatically. Anything else becomes a note. Press <kbd>⌘K</kbd> to find something instead.</p>
    {message && <p role="status" className="mb-3 text-sm text-emerald-700">{message}</p>}{captureError && <p role="alert" className="mb-3 text-sm text-red-700">{captureError}</p>}
    <div className="mb-5 flex overflow-hidden rounded-[10px] border border-border bg-card [&_a]:flex [&_a]:min-w-0 [&_a]:flex-1 [&_a]:flex-col [&_a]:gap-[3px] [&_a]:border-r [&_a]:border-border [&_a]:px-[9px] [&_a]:py-3 [&_a:last-child]:border-r-0 [&_a:hover]:bg-accent md:[&_a]:px-[18px] md:[&_a]:pb-3.5 md:[&_a]:pt-[15px] [&_strong]:text-[23px] [&_strong]:font-extrabold [&_strong]:leading-[1.1] [&_strong]:tracking-[-.03em] [&_span]:text-[9px] [&_span]:font-extrabold [&_span]:uppercase [&_span]:tracking-[.03em] [&_span]:text-muted-foreground md:[&_span]:text-[10.5px] md:[&_span]:tracking-[.1em]">{cards.map(card => <Link href={card.href} key={card.label}><strong>{card.count ?? "—"}</strong><span>{card.label}</span></Link>)}</div>
    <div className="grid grid-cols-1 items-start gap-[18px] md:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] [&>*]:min-w-0"><section className="rounded-[10px] border border-border bg-card px-2.5 pb-1 pt-2.5" aria-labelledby="recent-title"><div className="mb-3.5 flex items-center justify-between gap-3 px-2 pb-0.5 pt-2 [&_h2]:min-w-0 [&_h2]:text-[15px] [&_h2]:font-extrabold [&_h2]:[overflow-wrap:anywhere] [&_button]:text-[12.5px] [&_button]:font-bold [&_button]:text-primary"><h2 id="recent-title">Continue where you left off</h2><button onClick={() => window.dispatchEvent(new Event("stash:search"))}>Find anything</button></div>
      {isError ? <p className="px-3 py-[30px] text-center text-[13px] text-muted-foreground [&_button]:font-bold [&_button]:text-primary" role="alert">Couldn’t load your activity. <button onClick={() => refetch()}>Try again</button></p> : items.length === 0 ? <div className="px-3 py-[30px] text-center text-[13px] text-muted-foreground [&_button]:font-bold [&_button]:text-primary"><p>Nothing here yet. Capture your first link or note above.</p></div> : items.map(item => { const Icon = icons[item.type] ?? FileText; return <Link key={`${item.type}-${item.id}`} href={itemHref(item)} className="flex min-h-14 items-center gap-[13px] rounded-lg border-b border-border px-2 py-[11px] last:border-b-0 hover:bg-accent [&_strong]:block [&_strong]:truncate [&_strong]:text-[13.5px] [&_small]:block [&_small]:truncate [&_small]:text-xs [&_small]:text-muted-foreground [&_time]:whitespace-nowrap [&_time]:font-mono [&_time]:text-[10px] [&_time]:text-muted-foreground md:[&_time]:text-[11px]"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-[9px] ${item.type === "link" ? "bg-[#e2f4ec] text-[#0b7a55]" : item.type === "note" ? "bg-[#fbf0dc] text-[#945e16]" : "bg-[#ece9fd] text-[#4f3de8]"}`}><Icon size={17} /></span><span className="min-w-0 flex-1"><strong>{item.title || "Untitled"}</strong><small>{item.description || item.type}</small></span><time>{timeAgo(item.updatedAt)}</time></Link>; })}</section>
      <aside className="flex flex-col gap-4"><div className="rounded-[10px] border border-primary/20 bg-gradient-to-br from-primary/10 to-card p-5 [&_h2]:mb-1 [&_h2]:mt-2 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:font-bold [&_p]:mb-3.5 [&_p]:text-[13px] [&_p]:leading-[1.55] [&_p]:text-muted-foreground"><span className="inline-flex rounded-full bg-primary/10 px-[9px] py-[3px] text-[10px] font-extrabold text-primary">YOUR WORDS</span><h2>Keep learning.</h2><p>{wordCount === undefined ? "Review your saved vocabulary at your own pace." : `${wordCount} ${wordCount === 1 ? "word" : "words"} not yet mastered.`}</p><Link className="inline-flex min-h-10 items-center gap-[7px] rounded-[9px] bg-primary px-[17px] py-2.5 text-[13.5px] font-bold text-primary-foreground" href="/words">Review words</Link></div><div className="rounded-[10px] border border-border bg-card p-5 [&_h2]:mb-1 [&_h2]:text-sm [&_h2]:font-extrabold [&_p]:mb-3.5 [&_p]:text-[13px] [&_p]:leading-[1.55] [&_p]:text-muted-foreground"><span className="mb-2.5 grid h-[34px] w-[34px] place-items-center rounded-[9px] bg-primary/10 text-primary"><Chrome size={18} /></span><h2>Save without switching tabs</h2><p>The Chrome extension lets you save pages directly to your Stash.</p><Link href="/settings" className="inline-flex rounded-lg border border-border px-[11px] py-1.5 text-[12.5px] font-bold">Open settings</Link></div></aside>
    </div>
  </div>;
}
