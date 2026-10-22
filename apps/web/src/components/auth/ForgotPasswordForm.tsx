"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle2, AlertTriangle } from "lucide-react";
import FormField from "../ui/form-field";
import { useForgotPassword } from "@/hooks/use-auth-extras";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const mutation = useForgotPassword();
  const done = mutation.isSuccess;
  const smtpConfigured =
    (mutation.data as { data?: { smtpConfigured?: boolean } } | undefined)?.data
      ?.smtpConfigured ?? true;

  return (
    <div className="space-y-5">
      {done ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm text-foreground">
              If that email exists, a reset link is on its way. Check your
              inbox (and spam) — the link expires in 1 hour.
            </p>
          </div>
          {!smtpConfigured && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <p className="text-xs text-muted-foreground">
                Heads-up: email delivery isn&apos;t configured on this server
                yet (SMTP env missing), so the link was only logged on the
                server console.
              </p>
            </div>
          )}
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Link>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (email.trim()) mutation.mutate(email.trim());
          }}
          className="space-y-5"
        >
          <FormField
            id="email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            name="email"
          />
          {mutation.isError && (
            <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {mutation.error instanceof Error
                ? mutation.error.message
                : "Something went wrong"}
            </p>
          )}
          <button
            type="submit"
            disabled={mutation.isPending || !email.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            {mutation.isPending ? "Sending link…" : "Send reset link"}
          </button>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Link>
        </form>
      )}
    </div>
  );
}
