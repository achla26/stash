"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { MarkdownPreview } from "@/components/notes/markdown-preview";

type PublicNote = {
  title: string;
  content: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function PublicNotePage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const [state, setState] = useState<"loading" | "ok" | "notfound">("loading");
  const [note, setNote] = useState<PublicNote | null>(null);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/notes/public/${slug}`)
      .then(async (res) => {
        if (!res.ok) {
          setState("notfound");
          return;
        }
        const json = await res.json();
        setNote(json.data as PublicNote);
        setState("ok");
      })
      .catch(() => setState("notfound"));
  }, [slug]);

  if (state === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (state === "notfound" || !note) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <p className="text-lg font-semibold text-foreground">
          Note not found
        </p>
        <p className="text-sm text-muted-foreground">
          Ye note share nahi hai ya link galat hai.
        </p>
        <a
          href="/"
          className="mt-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Go to Stash
        </a>
      </div>
    );
  }

  const date = new Date(note.updatedAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-2xl px-6 pb-24 pt-10 sm:px-8">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {note.title || "Untitled"}
        </h1>
        <p className="mt-3 text-[12px] text-muted-foreground/60">{date}</p>
        <div className="mt-8">
          <MarkdownPreview text={note.content ?? ""} />
        </div>
        <div className="mt-16 border-t border-border/60 pt-6 text-center">
          <a
            href="/"
            className="text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Written with Stash
          </a>
        </div>
      </div>
    </div>
  );
}
