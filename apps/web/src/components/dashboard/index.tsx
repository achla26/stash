"use client";
import { Card } from "@/components/ui/card";
import { Page, Grid, Stack } from "@/components/ui/layout";
import { Kbd } from "@/components/ui/kbd";
import { Button } from "@/components/ui/button";
import { StatStrip } from "@/components/shared/stat-strip";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  BookOpen,
  FileCode,
  FileText,
  Link2,
  Plus,
  Zap,
  Chrome,
} from "lucide-react";
import { useDashboard } from "@/hooks/use-dashboard";
import { useAuth } from "@/hooks/use-auth";
import { useWords } from "@/hooks/use-words";
import { useCreateLink } from "@/hooks/use-links";
import { useCreateNote } from "@/hooks/use-notes";
import { DashboardSkeleton } from "@/components/shared/skeletons/page-skeleton";
import { timeAgo } from "@/utils";
import type { RecentItem } from "@repo/contracts/types";

const icons: Record<string, React.ElementType> = {
  note: FileText,
  link: Link2,
  notebook: BookOpen,
  page: FileCode,
};
function itemHref(item: RecentItem) {
  if (item.type === "note") return `/notes/${item.id}`;
  if (item.type === "notebook") return `/notebooks/${item.id}`;
  if (item.type === "page") return "/notebooks";
  return "/links";
}
function asUrl(value: string): string | null {
  if (/\s/.test(value)) return null;
  try {
    const url = new URL(
      /^https?:\/\//i.test(value) ? value : `https://${value}`,
    );
    return (url.protocol === "https:" || url.protocol === "http:") &&
      url.hostname.includes(".")
      ? url.href
      : null;
  } catch {
    return null;
  }
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
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const wordCount = words?.filter((w) => !w.mastered).length;
  const cards = [
    { label: "Notes", count: data?.stats.totalNotes, href: "/notes" },
    { label: "Links", count: data?.stats.totalLinks, href: "/links" },
    {
      label: "Notebooks",
      count: data?.stats.totalNotebooks,
      href: "/notebooks",
    },
    {
      label: "Words to review",
      count: wordsError ? undefined : wordCount,
      href: "/words",
    },
  ];
  async function handleCapture(e: FormEvent) {
    e.preventDefault();
    const value = capture.trim();
    if (!value) {
      window.dispatchEvent(new Event("stash:capture"));
      return;
    }
    setCaptureError("");
    setMessage("");
    try {
      const url = asUrl(value);
      if (url)
        await createLink.mutateAsync({
          url,
          title: undefined,
          description: undefined,
          tags: [],
        });
      else
        await createNote.mutateAsync({
          title: value.slice(0, 200),
          content: value,
        });
      setCapture("");
      setMessage(
        url ? "Link saved to your stash." : "Note saved to your stash.",
      );
    } catch (error) {
      setCaptureError(
        error instanceof Error
          ? error.message
          : "Could not save. Please try again.",
      );
    }
  }
  const busy = createLink.isPending || createNote.isPending;
  return (
    <Page className="text-sm text-foreground">
      <div className="mb-[22px] mt-0.5 flex items-start justify-between gap-6">
        <div>
          <h1 className="font-serif text-[clamp(25px,3.4vw,32px)] font-bold leading-[1.25] tracking-[-.01em]">
            {greeting}, {firstName}.
          </h1>
          <p className="mt-[7px] text-[14.5px] text-muted-foreground">
            Pick up where you left off.
          </p>
        </div>
        <div className="hidden shrink-0 pt-1.5 text-right md:block">
          <strong className="block text-[13.5px]">
            {new Intl.DateTimeFormat("en", {
              weekday: "long",
              month: "long",
              day: "numeric",
            }).format(new Date())}
          </strong>
          <span className="mt-[3px] block text-[9.5px] font-extrabold tracking-[.14em] text-muted-foreground">
            STASH · DASHBOARD
          </span>
        </div>
      </div>
      <form
        className="mb-2 flex items-center gap-2.5 rounded-[var(--radius-dialog)] border-[1.5px] border-border bg-card py-[7px] pl-4 pr-[7px] text-muted-foreground focus-within:border-muted-foreground"
        onSubmit={handleCapture}
      >
        <Plus size={19} aria-hidden="true" />
        <label className="sr-only" htmlFor="quick-capture">
          Paste a link or type a note
        </label>
        <input
          className="min-w-0 flex-1 border-0 bg-transparent py-[9px] text-[15px] text-foreground outline-none"
          id="quick-capture"
          value={capture}
          onChange={(e) => setCapture(e.target.value)}
          placeholder="Paste a link, or just start typing a note…"
          autoComplete="off"
        />
        <Kbd className="hidden md:block">↵ to save</Kbd>
        <Button
          type="submit"
          disabled={busy}
          className="gap-0 text-[0px] md:gap-2 md:text-sm"
        >
          <Zap size={16} /> {busy ? "Saving…" : "Capture"}
        </Button>
      </form>
      <p className="mb-[22px] px-1 text-xs text-muted-foreground">
        Links are detected automatically. Anything else becomes a note. Press{" "}
        <Kbd>⌘K</Kbd> to find something instead.
      </p>
      {message && (
        <p role="status" className="mb-3 text-sm text-emerald-700">
          {message}
        </p>
      )}
      {captureError && (
        <p role="alert" className="mb-3 text-sm text-red-700">
          {captureError}
        </p>
      )}
      <StatStrip
        items={cards.map((card) => ({
          label: card.label,
          value: card.count ?? "—",
          href: card.href,
        }))}
      />
      <Grid className="grid-cols-1 items-start md:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <Card
          as="section"
          className="px-2.5 pb-1 pt-2.5"
          aria-labelledby="recent-title"
        >
          <div className="mb-3.5 flex items-center justify-between gap-3 px-2 pb-0.5 pt-2">
            <h2
              id="recent-title"
              className="min-w-0 break-words text-[15px] font-extrabold"
            >
              Continue where you left off
            </h2>
            <button
              className="text-[12.5px] font-bold text-primary"
              onClick={() => window.dispatchEvent(new Event("stash:search"))}
            >
              Find anything
            </button>
          </div>
          {isError ? (
            <p
              className="px-3 py-[30px] text-center text-[13px] text-muted-foreground"
              role="alert"
            >
              Couldn’t load your activity.{" "}
              <button
                className="font-bold text-primary"
                onClick={() => refetch()}
              >
                Try again
              </button>
            </p>
          ) : items.length === 0 ? (
            <div className="px-3 py-[30px] text-center text-[13px] text-muted-foreground">
              <p>Nothing here yet. Capture your first link or note above.</p>
            </div>
          ) : (
            items.map((item) => {
              const Icon = icons[item.type] ?? FileText;
              return (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={itemHref(item)}
                  className="flex min-h-14 items-center gap-[13px] rounded-lg border-b border-border px-2 py-[11px] last:border-b-0 hover:bg-accent"
                >
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-[9px] ${item.type === "link" ? "bg-[#e2f4ec] text-[#0b7a55]" : item.type === "note" ? "bg-[#fbf0dc] text-[#945e16]" : "bg-[#ece9fd] text-[#4f3de8]"}`}
                  >
                    <Icon size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-[13.5px]">
                      {item.title || "Untitled"}
                    </strong>
                    <small className="block truncate text-xs text-muted-foreground">
                      {item.description || item.type}
                    </small>
                  </span>
                  <time className="whitespace-nowrap font-mono text-[10px] text-muted-foreground md:text-[11px]">
                    {timeAgo(item.updatedAt)}
                  </time>
                </Link>
              );
            })
          )}
        </Card>
        <Stack>
          <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-card p-5">
            <span className="inline-flex rounded-full bg-primary/10 px-[9px] py-[3px] text-[10px] font-extrabold text-primary">
              YOUR WORDS
            </span>
            <h2 className="mb-1 mt-2 font-serif text-2xl font-bold">
              Keep learning.
            </h2>
            <p className="mb-3.5 text-[13px] leading-[1.55] text-muted-foreground">
              {wordCount === undefined
                ? "Review your saved vocabulary at your own pace."
                : `${wordCount} ${wordCount === 1 ? "word" : "words"} not yet mastered.`}
            </p>
            <Button asChild>
              <Link href="/words">Review words</Link>
            </Button>
          </Card>
          <Card className="p-5">
            <span className="mb-2.5 grid h-[34px] w-[34px] place-items-center rounded-[9px] bg-primary/10 text-primary">
              <Chrome size={18} />
            </span>
            <h2 className="mb-1 text-sm font-extrabold">
              Save without switching tabs
            </h2>
            <p className="mb-3.5 text-[13px] leading-[1.55] text-muted-foreground">
              The Chrome extension lets you save pages directly to your Stash.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/settings">Open settings</Link>
            </Button>
          </Card>
        </Stack>
      </Grid>
    </Page>
  );
}
