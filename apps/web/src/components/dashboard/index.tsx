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
  return <div className="prototype-dashboard mx-auto max-w-[1080px]">
    <div className="proto-hero"><div><h1>{greeting}, {firstName}.</h1><p>Pick up where you left off.</p></div><div className="proto-date"><strong>{new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date())}</strong><span>STASH · DASHBOARD</span></div></div>
    <form className="proto-capture" onSubmit={handleCapture}><Plus size={19} aria-hidden="true" /><label className="sr-only" htmlFor="quick-capture">Paste a link or type a note</label><input id="quick-capture" value={capture} onChange={e => setCapture(e.target.value)} placeholder="Paste a link, or just start typing a note…" autoComplete="off" /><kbd>↵ to save</kbd><button type="submit" disabled={busy}><Zap size={16} /> {busy ? "Saving…" : "Capture"}</button></form>
    <p className="proto-hint">Links are detected automatically. Anything else becomes a note. Press <kbd>⌘K</kbd> to find something instead.</p>
    {message && <p role="status" className="mb-3 text-sm text-emerald-700">{message}</p>}{captureError && <p role="alert" className="mb-3 text-sm text-red-700">{captureError}</p>}
    <div className="proto-glance">{cards.map(card => <Link href={card.href} key={card.label}><strong>{card.count ?? "—"}</strong><span>{card.label}</span></Link>)}</div>
    <div className="proto-grid"><section className="proto-card proto-activity" aria-labelledby="recent-title"><div className="proto-card-head"><h2 id="recent-title">Continue where you left off</h2><button onClick={() => window.dispatchEvent(new Event("stash:search"))}>Find anything</button></div>
      {isError ? <p className="proto-empty" role="alert">Couldn’t load your activity. <button onClick={() => refetch()}>Try again</button></p> : items.length === 0 ? <div className="proto-empty"><p>Nothing here yet. Capture your first link or note above.</p></div> : items.map(item => { const Icon = icons[item.type] ?? FileText; return <Link key={`${item.type}-${item.id}`} href={itemHref(item)} className="proto-activity-row"><span className={`proto-item-icon proto-${item.type}`}><Icon size={17} /></span><span className="min-w-0 flex-1"><strong>{item.title || "Untitled"}</strong><small>{item.description || item.type}</small></span><time>{timeAgo(item.updatedAt)}</time></Link>; })}</section>
      <aside className="proto-stack"><div className="proto-card proto-words"><span className="proto-pill">YOUR WORDS</span><h2>Keep learning.</h2><p>{wordCount === undefined ? "Review your saved vocabulary at your own pace." : `${wordCount} ${wordCount === 1 ? "word" : "words"} not yet mastered.`}</p><Link className="proto-button" href="/words">Review words</Link></div><div className="proto-card proto-tip"><span className="proto-tip-icon"><Chrome size={18} /></span><h2>Save without switching tabs</h2><p>The Chrome extension lets you save pages directly to your Stash.</p><Link href="/settings" className="proto-outline">Open settings</Link></div></aside>
    </div>
  </div>;
}
