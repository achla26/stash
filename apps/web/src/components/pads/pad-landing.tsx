"use client";
import { Card } from "@/components/ui/card";
import { Grid, Section } from "@/components/ui/layout";
import { Button } from "@/components/ui/button";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Shuffle,
  Zap,
  Lock,
  Clock,
  Link2,
  LayoutDashboard,
  Users,
  Utensils,
  BookOpen,
} from "lucide-react";
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
  const { data: myPads = [], isLoading: padsLoading } =
    useUserPads(isAuthenticated);

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
      },
    );
  };
  // Navigate to custom slug (creates if doesn't exist)
  const handleGoToSlug = () => {
    if (!isSlugValid) return;
    router.push(`/pad/${sanitized}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {!embedded && (
        <header className="flex h-[60px] items-center justify-between gap-3 border-b border-border bg-card px-4 sm:px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 font-serif text-xl font-bold"
          >
            <span className="grid h-[34px] w-[34px] place-items-center rounded-[9px] bg-primary text-primary-foreground">
              <FileText size={18} />
            </span>
            <strong>Stash</strong>
          </Link>
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <LayoutDashboard size={16} /> Dashboard
            </Link>
          </Button>
        </header>
      )}
      <main
        className={
          embedded
            ? "mx-auto max-w-[1080px]"
            : "mx-auto max-w-[1080px] px-4 pb-[90px] pt-7 sm:px-6"
        }
      >
        <h2 className="mb-[18px] text-[15px] font-extrabold">
          Instant, shareable pages
        </h2>
        <div className="flex flex-col items-center gap-5 px-4 py-11 text-center">
          <span className="grid h-[70px] w-[70px] place-items-center rounded-[17px] bg-primary text-primary-foreground">
            <FileText size={26} />
          </span>
          <h1 className="text-[clamp(24px,3.6vw,31px)] font-extrabold tracking-[-.02em]">
            Instant notes, shareable by link
          </h1>
          <p className="max-w-[480px] text-[14.5px] text-muted-foreground">
            A pad is a blank page you can share by link. Perfect for meeting
            notes, recipes or quick jots.
          </p>
          <form
            className={`flex w-full ${embedded ? "max-w-none" : "max-w-[440px]"} min-w-0 items-center rounded-[var(--radius-card)] border-[1.5px] border-input bg-card py-[5px] pl-4 pr-[5px] text-muted-foreground`}
            onSubmit={(e) => {
              e.preventDefault();
              if (displaySlug.trim()) handleGoToSlug();
              else handleCreateRandom();
            }}
          >
            <span className="font-mono text-sm font-bold">/pad/</span>
            <label className="sr-only" htmlFor="pad-slug">
              Pad name
            </label>
            <input
              className="min-w-0 flex-1 border-0 bg-transparent px-1.5 py-2.5 font-mono text-sm text-foreground outline-none"
              id="pad-slug"
              value={displaySlug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="my-notes"
              autoComplete="off"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleGenerateRandom}
              aria-label="Generate random pad name"
            >
              <Shuffle size={14} /> Random
            </Button>
          </form>
          {displaySlug && !isSlugValid && (
            <p className="mt-2 text-xs text-destructive">
              Pad name must be at least {MIN_SLUG_LENGTH} characters.
            </p>
          )}
          {showSanitizedHint && isSlugValid && (
            <p className="mt-2 text-xs text-muted-foreground">
              Will open as: /pad/{sanitized}
            </p>
          )}
          <Button
            size="hero"
            disabled={
              createPadMutation.isPending || (!!displaySlug && !isSlugValid)
            }
            onClick={() =>
              displaySlug.trim() ? handleGoToSlug() : handleCreateRandom()
            }
          >
            <Zap size={16} />
            {createPadMutation.isPending ? "Creating…" : "Open pad"}
          </Button>
          {createPadMutation.isError && (
            <p role="alert" className="mt-2 text-xs text-destructive">
              {(createPadMutation.error as Error)?.message ??
                "Failed to create pad"}
            </p>
          )}
          <Grid
            className={`w-full ${embedded ? "max-w-none" : "max-w-[680px]"} grid-cols-1 gap-2.5 min-[431px]:grid-cols-2 md:grid-cols-4`}
          >
            {FEATURES.map(({ icon: Icon, text }) => (
              <Card
                key={text}
                className="flex items-center gap-[7px] p-[13px] text-left text-[12.5px] font-semibold text-muted-foreground"
              >
                <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[var(--radius-control)] bg-primary/10 text-primary">
                  <Icon size={16} />
                </span>
                {text}
              </Card>
            ))}
          </Grid>
          <Section className="w-full max-w-[680px] text-left">
            <h2 className="mb-2 font-mono text-[11px] font-bold uppercase tracking-[.06em] text-muted-foreground">
              Start from a template
            </h2>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={createPadMutation.isPending}
                onClick={() =>
                  handleCreateRandom(
                    "# Meeting notes\n\nDate: \nAttendees: \n\n## Agenda\n\n## Notes\n\n## Action items\n",
                  )
                }
              >
                <Users size={15} /> Meeting notes
              </Button>
              <Button
                variant="outline"
                disabled={createPadMutation.isPending}
                onClick={() =>
                  handleCreateRandom(
                    "# Recipe\n\n## Ingredients\n\n## Method\n",
                  )
                }
              >
                <Utensils size={15} /> Recipe
              </Button>
              <Button
                variant="outline"
                disabled={createPadMutation.isPending}
                onClick={() =>
                  handleCreateRandom(
                    "# Book club\n\nBook: \n\n## Thoughts\n\n## Discussion questions\n",
                  )
                }
              >
                <BookOpen size={15} /> Book club
              </Button>
            </div>
          </Section>
          {isAuthenticated && (
            <Section className="w-full max-w-[680px] text-left">
              <h2 className="mb-2.5 text-[13px] font-extrabold">Your pads</h2>
              {padsLoading ? (
                <p className="text-[13px] text-muted-foreground">
                  Loading pads…
                </p>
              ) : myPads.length === 0 ? (
                <p className="text-[13px] text-muted-foreground">
                  No pads yet — create one above.
                </p>
              ) : (
                myPads.map((pad) => (
                  <button
                    className="mt-2 flex w-full items-center gap-2.5 rounded-[var(--radius-control)] border border-border p-3 text-left text-[13px]"
                    key={pad.id}
                    onClick={() => router.push(`/pad/${pad.slug}`)}
                  >
                    <FileText size={16} />
                    <span>
                      /pad/{pad.slug}
                      <small className="block text-muted-foreground">
                        Updated {timeAgo(pad.updatedAt)}
                      </small>
                    </span>
                    <span className="ml-auto">{pad.visibility}</span>
                  </button>
                ))
              )}
            </Section>
          )}
        </div>
      </main>
    </div>
  );
}
