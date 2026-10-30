"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Shuffle, Zap, Lock, Clock, Link2, LayoutDashboard, Users, Utensils, BookOpen } from "lucide-react";
import Link from "next/link";
import { useCreatePad, useUserPads } from "@/hooks/use-pads";
import { useAuth } from "@/hooks/use-auth";
import { timeAgo } from "@/utils";
import { generateRandomSlug, sanitizeSlug } from "@/utils";

/* ===== Constants ===== */

const MIN_SLUG_LENGTH = 3;

const FEATURES = [
  { icon: Zap, text: "Instant — no signup needed" },
  { icon: Lock, text: "Optional password protection" },
  { icon: Clock, text: "Auto-expire support" },
  { icon: Link2, text: "Shareable links" },
];

/* ===== Component ===== */

export function PadLanding({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter();
  const [displaySlug, setDisplaySlug] = useState("");
  const createPadMutation = useCreatePad();
  const { isAuthenticated } = useAuth({ redirect: false });
  const { data: myPads = [], isLoading: padsLoading } = useUserPads(isAuthenticated);

  // Sanitized version of what user typed
  const sanitized = sanitizeSlug(displaySlug);

  // Is the sanitized slug valid to submit?
  const isSlugValid = sanitized.length >= MIN_SLUG_LENGTH;

  // Show hint only when sanitized differs from what user typed
  const showSanitizedHint =
    displaySlug.trim() !== "" && sanitized !== displaySlug.toLowerCase().trim();

  /* ---- Handlers ---- */

  const handleGenerateRandom = () => {
    const slug = generateRandomSlug();
    setDisplaySlug(slug); // sanitized === displaySlug here, no hint shown
  };

  const handleSlugChange = (value: string) => {
    setDisplaySlug(value);
  };

  // Create pad with random slug (backend generates it)
  const handleCreateRandom = (content?: string) => {
    createPadMutation.mutate(
      { allowEdit: false, content },
      {
        onSuccess: (pad) => {
          if (pad.ownerToken) {
            localStorage.setItem(`pad_owner_${pad.slug}`, pad.ownerToken);
          }
          router.push(`/pad/${pad.slug}`);
        },
      }
    );
  };
  // Navigate to custom slug (creates if doesn't exist)
  const handleGoToSlug = () => {
    if (!isSlugValid) return;
    router.push(`/pad/${sanitized}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {!embedded && <header className="flex h-[60px] items-center justify-between gap-3 border-b border-border bg-card px-4 sm:px-6"><Link href="/dashboard" className="flex items-center gap-2.5 font-serif text-xl font-bold [&_span]:grid [&_span]:h-[34px] [&_span]:w-[34px] [&_span]:place-items-center [&_span]:rounded-[9px] [&_span]:bg-primary [&_span]:text-primary-foreground"><span><FileText size={18}/></span><strong>Stash</strong></Link><Link href="/dashboard" className="inline-flex min-h-[38px] items-center justify-center gap-[7px] rounded-lg border border-border bg-card px-3 text-[13px] font-bold disabled:opacity-50"><LayoutDashboard size={16}/> Dashboard</Link></header>}
      <main className={embedded ? "mx-auto max-w-[1080px]" : "mx-auto max-w-[1080px] px-4 pb-[90px] pt-7 sm:px-6"}><div className="mb-[18px] [&_h2]:text-[15px] [&_h2]:font-extrabold"><h2>Instant, shareable pages</h2></div><div className="flex flex-col items-center gap-5 px-4 py-11 text-center [&_h1]:text-[clamp(24px,3.6vw,31px)] [&_h1]:font-extrabold [&_h1]:tracking-[-.02em]"><span className="grid h-[70px] w-[70px] place-items-center rounded-[17px] bg-primary text-primary-foreground"><FileText size={26}/></span><h1>Instant notes, shareable by link</h1><p className="max-w-[480px] text-[14.5px] text-muted-foreground">A pad is a blank page you can share by link. Perfect for meeting notes, recipes or quick jots.</p><form className={`flex w-full ${embedded ? "max-w-none" : "max-w-[440px]"} min-w-0 items-center rounded-[10px] border-[1.5px] border-input bg-card py-[5px] pl-4 pr-[5px] text-muted-foreground [&>span]:font-mono [&>span]:text-sm [&>span]:font-bold [&_input]:min-w-0 [&_input]:flex-1 [&_input]:border-0 [&_input]:bg-transparent [&_input]:px-1.5 [&_input]:py-2.5 [&_input]:font-mono [&_input]:text-sm [&_input]:text-foreground [&_input]:outline-none [&_button]:flex [&_button]:min-h-9 [&_button]:items-center [&_button]:gap-[5px] [&_button]:rounded-lg [&_button]:bg-accent [&_button]:px-[11px] [&_button]:py-2 [&_button]:text-xs [&_button]:font-bold`} onSubmit={e => { e.preventDefault(); if (displaySlug.trim()) handleGoToSlug(); else handleCreateRandom(); }}><span>/pad/</span><label className="sr-only" htmlFor="pad-slug">Pad name</label><input id="pad-slug" value={displaySlug} onChange={e => handleSlugChange(e.target.value)} placeholder="my-notes" autoComplete="off"/><button type="button" onClick={handleGenerateRandom} aria-label="Generate random pad name"><Shuffle size={14}/> Random</button></form>
      {displaySlug && !isSlugValid && <p className="mt-2 text-xs text-destructive">Pad name must be at least {MIN_SLUG_LENGTH} characters.</p>}{showSanitizedHint && isSlugValid && <p className="mt-2 text-xs text-muted-foreground">Will open as: /pad/{sanitized}</p>}
      <button className="inline-flex min-h-[46px] items-center gap-[7px] rounded-[9px] bg-primary px-6 py-[13px] text-[15px] font-bold text-primary-foreground disabled:opacity-50" disabled={createPadMutation.isPending || (!!displaySlug && !isSlugValid)} onClick={() => displaySlug.trim() ? handleGoToSlug() : handleCreateRandom()}><Zap size={16}/>{createPadMutation.isPending ? "Creating…" : "Open pad"}</button>
      {createPadMutation.isError && <p role="alert" className="mt-2 text-xs text-destructive">{(createPadMutation.error as Error)?.message ?? "Failed to create pad"}</p>}
      <div className={`grid w-full ${embedded ? "max-w-none" : "max-w-[680px]"} grid-cols-1 gap-2.5 min-[431px]:grid-cols-2 md:grid-cols-4 [&_div]:flex [&_div]:items-center [&_div]:gap-[7px] [&_div]:rounded-[9px] [&_div]:border [&_div]:border-border [&_div]:bg-card [&_div]:p-[13px] [&_div]:text-left [&_div]:text-[12.5px] [&_div]:font-semibold [&_div]:text-muted-foreground [&_span]:grid [&_span]:h-[30px] [&_span]:w-[30px] [&_span]:shrink-0 [&_span]:place-items-center [&_span]:rounded-lg [&_span]:bg-primary/10 [&_span]:text-primary`}>{FEATURES.map(({icon: Icon,text}) => <div key={text}><span><Icon size={16}/></span>{text}</div>)}</div>
      <section className="w-full max-w-[680px] text-left [&_h2]:mb-2 [&_h2]:font-mono [&_h2]:text-[11px] [&_h2]:font-bold [&_h2]:uppercase [&_h2]:tracking-[.06em] [&_h2]:text-muted-foreground [&_div]:flex [&_div]:flex-wrap [&_div]:gap-2"><h2>Start from a template</h2><div><button className="inline-flex min-h-[38px] items-center justify-center gap-[7px] rounded-lg border border-border bg-card px-3 text-[13px] font-bold disabled:opacity-50" disabled={createPadMutation.isPending} onClick={() => handleCreateRandom("# Meeting notes\n\nDate: \nAttendees: \n\n## Agenda\n\n## Notes\n\n## Action items\n")}><Users size={15}/> Meeting notes</button><button className="inline-flex min-h-[38px] items-center justify-center gap-[7px] rounded-lg border border-border bg-card px-3 text-[13px] font-bold disabled:opacity-50" disabled={createPadMutation.isPending} onClick={() => handleCreateRandom("# Recipe\n\n## Ingredients\n\n## Method\n")}><Utensils size={15}/> Recipe</button><button className="inline-flex min-h-[38px] items-center justify-center gap-[7px] rounded-lg border border-border bg-card px-3 text-[13px] font-bold disabled:opacity-50" disabled={createPadMutation.isPending} onClick={() => handleCreateRandom("# Book club\n\nBook: \n\n## Thoughts\n\n## Discussion questions\n")}><BookOpen size={15}/> Book club</button></div></section>
      {isAuthenticated && <section className="w-full max-w-[680px] text-left [&_h2]:mb-2.5 [&_h2]:text-[13px] [&_h2]:font-extrabold [&_p]:text-[13px] [&_p]:text-muted-foreground [&_button]:mt-2 [&_button]:flex [&_button]:w-full [&_button]:items-center [&_button]:gap-2.5 [&_button]:rounded-[9px] [&_button]:border [&_button]:border-border [&_button]:p-3 [&_button]:text-left [&_button]:text-[13px] [&_small]:block [&_small]:text-muted-foreground"><h2>Your pads</h2>{padsLoading ? <p>Loading pads…</p> : myPads.length === 0 ? <p>No pads yet — create one above.</p> : myPads.map(p => <button key={p.id} onClick={() => router.push(`/pad/${p.slug}`)}><FileText size={16}/><span>/pad/{p.slug}<small>Updated {timeAgo(p.updatedAt)}</small></span><span className="ml-auto">{p.visibility}</span></button>)}</section>}
      </div></main>
    </div>
  );
}
