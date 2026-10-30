import Link from "next/link";
import { Folder, LockKeyhole, Search, ShieldCheck, Zap } from "lucide-react";

interface AuthFormWrapperProps {
  title: string;
  subtitle: string;
  isLogin: boolean;
  children: React.ReactNode;
}
export default function AuthFormWrapper({
  title,
  subtitle,
  isLogin,
  children,
}: AuthFormWrapperProps) {
  return (
    <div className="grid min-h-screen grid-cols-1 text-foreground md:grid-cols-[1.05fr_1fr]">
      <aside className="hidden flex-col justify-center border-r border-border bg-accent p-14 md:flex">
        <p className="max-w-[480px] font-serif text-[clamp(23px,2.6vw,30px)] font-bold leading-[1.35] tracking-[-.01em]">
          Stash is a <b className="text-primary">sharp little tool</b> for
          everything you learn — capture it once, find it instantly, on every
          device.
        </p>
        <div className="mt-[34px] flex flex-col gap-3.5">
          <div className="flex items-center gap-3 text-sm font-semibold">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] bg-primary/10 text-primary">
              <Zap size={17} />
            </span>
            Save useful pages, notes and ideas in one place
          </div>
          <div className="flex items-center gap-3 text-sm font-semibold">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] bg-primary/10 text-primary">
              <Search size={17} />
            </span>
            Find your saved items when you need them
          </div>
          <div className="flex items-center gap-3 text-sm font-semibold">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] bg-primary/10 text-primary">
              <Folder size={17} />
            </span>
            Collections that organise the way you think
          </div>
          <div className="flex items-center gap-3 text-sm font-semibold">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] bg-primary/10 text-primary">
              <LockKeyhole size={17} />
            </span>
            Keep your learning space your own
          </div>
        </div>
        <p className="mt-[38px] flex items-center gap-2 text-[12.5px] text-muted-foreground">
          <ShieldCheck size={16} /> Free to get started · No card required
        </p>
      </aside>
      <main className="flex min-h-screen items-center justify-center bg-background px-6 py-10 md:min-h-0">
        <div className="w-full max-w-[400px]">
          <Link href="/" className="mb-7 flex items-center gap-3">
            <span className="grid h-[42px] w-[42px] place-items-center rounded-[11px] bg-primary text-primary-foreground">
              <svg
                viewBox="0 0 32 32"
                width="26"
                height="26"
                fill="currentColor"
                aria-hidden="true"
              >
                <rect x="3" y="5" width="20" height="5" rx="2.5" />
                <rect
                  x="7"
                  y="13"
                  width="20"
                  height="5"
                  rx="2.5"
                  opacity=".8"
                />
                <rect
                  x="11"
                  y="21"
                  width="16"
                  height="5"
                  rx="2.5"
                  opacity=".6"
                />
              </svg>
            </span>
            <span>
              <strong className="block font-serif text-[22px] font-bold leading-[1.1]">
                Stash
              </strong>
              <small className="block pt-1 text-[9px] font-bold tracking-[.12em] text-muted-foreground">
                EVERYTHING YOU LEARN
              </small>
            </span>
          </Link>
          <h1 className="text-[26px] font-extrabold tracking-[-.02em]">
            {title}
          </h1>
          <p className="mb-6 mt-2 text-sm text-muted-foreground">{subtitle}</p>
          {children}
          <p className="mt-[18px] text-center text-[13.5px] text-muted-foreground">
            {isLogin ? "New here? " : "Already have an account? "}
            <Link
              className="font-bold text-primary"
              href={isLogin ? "/signup" : "/login"}
            >
              {isLogin ? "Create your stash — it’s free" : "Sign in"}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
