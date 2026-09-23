import Link from "next/link";
import { Infinity } from "lucide-react";

interface AuthFormWrapperProps {
  title: string;
  subtitle: string;
  isLogin: boolean;
  children: React.ReactNode;
}

export default function AuthFormWrapper({
  title,
  subtitle,
  isLogin = true,
  children,
}: AuthFormWrapperProps) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background p-4">
      {/* Background glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 0%, var(--primary-glow) 0%, transparent 50%)",
        }}
      />

      {/* Logo */}
      <Link
        href="/"
        className="relative z-10 mb-8 flex items-center gap-2"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
          <Infinity className="h-6 w-6 text-primary-foreground" />
        </div>
        <span className="text-2xl font-bold text-foreground">Stash</span>
      </Link>

      {/* Auth Card */}
      <div className="glass relative z-10 w-full max-w-md rounded-2xl border border-border p-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>

        {/* Children */}
        {children}

        {/* Footer link */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <Link
            href={isLogin ? "/signup" : "/login"}
            className="font-medium text-primary transition-opacity hover:underline hover:opacity-80"
          >
            {isLogin ? "Sign Up" : "Sign In"}
          </Link>
        </p>
      </div>
    </div>
  );
}