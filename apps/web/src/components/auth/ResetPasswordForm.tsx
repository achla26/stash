"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Lock, CheckCircle2, ArrowLeft } from "lucide-react";
import PasswordField from "../ui/password-field";
import { useResetPassword } from "@/hooks/use-auth-extras";

function ResetInner() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const mutation = useResetPassword();

  const mismatch = confirm.length > 0 && password !== confirm;

  if (!token) {
    return (
      <div className="space-y-4">
        <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          This reset link is missing its token. Request a new one below.
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Request a new link
        </Link>
      </div>
    );
  }

  if (mutation.isSuccess) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm text-foreground">
            Password updated. Sign in with your new password.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (password.length >= 6 && password === confirm) {
          mutation.mutate({ token, newPassword: password });
        }
      }}
      className="space-y-5"
    >
      <PasswordField
        id="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        name="newPassword"
      />
      <PasswordField
        id="confirm-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        name="confirmPassword"
        error={mismatch ? "Passwords don't match" : undefined}
      />
      {mutation.isError && (
        <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {mutation.error instanceof Error
            ? mutation.error.message
            : "Reset failed — the link may have expired"}
        </p>
      )}
      <button
        type="submit"
        disabled={mutation.isPending || password.length < 6 || mismatch}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
      >
        <Lock className="h-4 w-4" />
        {mutation.isPending ? "Updating…" : "Set new password"}
      </button>
    </form>
  );
}

export default function ResetPasswordForm() {
  return (
    <Suspense fallback={null}>
      <ResetInner />
    </Suspense>
  );
}
