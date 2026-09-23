"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, ArrowRight, Shuffle, Loader2, Sparkles, Zap, Lock, Clock, Link2, Infinity as InfinityIcon, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { useCreatePad } from "@/hooks/use-pads";
import { Button } from "@/components/ui/button";
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
  const handleCreateRandom = () => {
    createPadMutation.mutate(
      { allowEdit: false },
      {
        onSuccess: (pad) => {
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
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-14 items-center justify-between border-b border-border bg-sidebar/95 px-4 backdrop-blur">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <InfinityIcon className="h-5 w-5 text-white" />
          </span>
          <span className="text-lg font-bold text-foreground">Stash</span>
        </Link>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center p-6">
      {/* Background Gradient */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 0%, var(--primary-glow) 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 w-full max-w-md space-y-8 text-center">
        {/* Logo */}
        <div>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-[0_8px_24px_var(--primary-glow)]">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Stash Pad</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Instant shareable notes. No signup needed.
          </p>
        </div>

        {/* Random Create Button */}
        <Button
          onClick={handleCreateRandom}
          disabled={createPadMutation.isPending}
          className="w-full gap-2 bg-primary text-primary-foreground shadow-lg shadow-[0_8px_24px_var(--primary-glow)] hover:bg-primary-hover"
          size="lg"
        >
          {createPadMutation.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Shuffle className="h-5 w-5" />
          )}
          {createPadMutation.isPending ? "Creating..." : "Create Random Pad"}
        </Button>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-sm text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Custom URL Input */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 transition-colors focus-within:border-primary">
            <span className="whitespace-nowrap text-sm text-muted-foreground">
              /pad/
            </span>

            <input
              type="text"
              value={displaySlug}
              onChange={(e) => handleSlugChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGoToSlug()}
              placeholder="my-notes"
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />

            <button
              type="button"
              onClick={handleGenerateRandom}
              title="Generate random slug"
              className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
            >
              <Sparkles className="h-4 w-4" />
            </button>
          </div>

          {/* Validation message */}
          {displaySlug && !isSlugValid && (
            <p className="text-left text-xs text-destructive">
              Slug must be at least {MIN_SLUG_LENGTH} characters
            </p>
          )}

          {/* Sanitized hint */}
          {showSanitizedHint && isSlugValid && (
            <p className="text-left text-xs text-muted-foreground">
              Will be saved as:{" "}
              <span className="font-mono text-primary">{sanitized}</span>
            </p>
          )}

          <Button
            onClick={handleGoToSlug}
            disabled={!isSlugValid}
            variant="outline"
            className="w-full gap-2"
            size="lg"
          >
            Open or Create
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Features */}
        <FeatureList />

        {/* Error */}
        {createPadMutation.isError && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {(createPadMutation.error as Error)?.message ??
              "Failed to create pad"}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

/* ===== Feature List ===== */

function FeatureList() {
  return (
    <div className="grid grid-cols-2 gap-3 pt-4">
      {FEATURES.map(({ icon: Icon, text }) => (
        <div
          key={text}
          className="flex items-center gap-2 rounded-lg border border-border bg-card/50 px-3 py-2 text-left text-xs text-muted-foreground"
        >
          <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--primary)" }} />
          <span>{text}</span>
        </div>
      ))}
    </div>
  );
}