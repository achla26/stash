import Link from "next/link";
import { Infinity } from "lucide-react";

interface AuthFormWrapperProps {
  title: string;
  subtitle: string;
  isLogin: boolean;
  children: React.ReactNode;
}

export default function AuthFormWrapper({ title, subtitle, isLogin = true, children }: AuthFormWrapperProps) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Background Gradient */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 0%, var(--primary-glow) 0%, transparent 50%)",
        }}
      />

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-8 relative z-10">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
          <Infinity className="w-6 h-6 text-white" />
        </div>
        <span className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
          Stash
        </span>
      </Link>

      {/* Auth Card */}
      <div
        className="w-full max-w-md p-8 rounded-2xl border glass relative z-10"
        style={{ borderColor: 'var(--border)' }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
            {title}

          </h1>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {subtitle}
          </p>
        </div> 
        
        {/* Children rendered here */}
        {children}

        <p className="text-center mt-6 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {isLogin ? `Don't have an account? ` : 'Already Have an Account '}
          <Link href={isLogin ? `signup ` : 'login'}>
            <button
              className="font-medium hover:underline"
              style={{ color: 'var(--primary)' }}
            >
              {isLogin ? `Sign Up ` : 'Sign In'}
            </button>
          </Link>
        </p>
      </div>
    </div>
  );
}