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

export function PadLanding() {
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
    <div className="proto-pad-page">
      <header className="proto-pad-header"><Link href="/dashboard" className="proto-pad-brand"><span><FileText size={18}/></span><strong>Stash</strong></Link><Link href="/dashboard" className="proto-link-button"><LayoutDashboard size={16}/> Dashboard</Link></header>
      <main className="proto-pad-content"><div className="proto-notebooks-head"><h2>Instant, shareable pages</h2></div><div className="proto-pad-landing"><span className="proto-pad-icon"><FileText size={26}/></span><h1>Instant notes, shareable by link</h1><p className="proto-pad-sub">A pad is a blank page you can share by link. Perfect for meeting notes, recipes or quick jots.</p><form className="proto-pad-slug" onSubmit={e => { e.preventDefault(); if (displaySlug.trim()) handleGoToSlug(); else handleCreateRandom(); }}><span>/pad/</span><label className="sr-only" htmlFor="pad-slug">Pad name</label><input id="pad-slug" value={displaySlug} onChange={e => handleSlugChange(e.target.value)} placeholder="my-notes" autoComplete="off"/><button type="button" onClick={handleGenerateRandom} aria-label="Generate random pad name"><Shuffle size={14}/> Random</button></form>
      {displaySlug && !isSlugValid && <p className="proto-pad-error">Pad name must be at least {MIN_SLUG_LENGTH} characters.</p>}{showSanitizedHint && isSlugValid && <p className="proto-pad-hint">Will open as: /pad/{sanitized}</p>}
      <button className="proto-link-button primary proto-pad-go" disabled={createPadMutation.isPending || (!!displaySlug && !isSlugValid)} onClick={() => displaySlug.trim() ? handleGoToSlug() : handleCreateRandom()}><Zap size={16}/>{createPadMutation.isPending ? "Creating…" : "Open pad"}</button>
      {createPadMutation.isError && <p role="alert" className="proto-pad-error">{(createPadMutation.error as Error)?.message ?? "Failed to create pad"}</p>}
      <div className="proto-pad-features">{FEATURES.map(({icon: Icon,text}) => <div key={text}><span><Icon size={16}/></span>{text}</div>)}</div>
      <section className="proto-pad-templates"><h2>Start from a template</h2><div><button className="proto-link-button" disabled={createPadMutation.isPending} onClick={() => handleCreateRandom("# Meeting notes\n\nDate: \nAttendees: \n\n## Agenda\n\n## Notes\n\n## Action items\n")}><Users size={15}/> Meeting notes</button><button className="proto-link-button" disabled={createPadMutation.isPending} onClick={() => handleCreateRandom("# Recipe\n\n## Ingredients\n\n## Method\n")}><Utensils size={15}/> Recipe</button><button className="proto-link-button" disabled={createPadMutation.isPending} onClick={() => handleCreateRandom("# Book club\n\nBook: \n\n## Thoughts\n\n## Discussion questions\n")}><BookOpen size={15}/> Book club</button></div></section>
      {isAuthenticated && <section className="proto-pad-mine"><h2>Your pads</h2>{padsLoading ? <p>Loading pads…</p> : myPads.length === 0 ? <p>No pads yet — create one above.</p> : myPads.map(p => <button key={p.id} onClick={() => router.push(`/pad/${p.slug}`)}><FileText size={16}/><span>/pad/{p.slug}<small>Updated {timeAgo(p.updatedAt)}</small></span><span className="ml-auto">{p.visibility}</span></button>)}</section>}
      </div></main>
    </div>
  );
}
