"use client";

import { useEffect, useRef } from "react";
import { useGoogleLogin } from "@/hooks/use-auth-extras";

/* Google Identity Services — sirf button render + ID token verify server pe */
export default function GoogleButton() {
  const ref = useRef<HTMLDivElement>(null);
  const mutation = useGoogleLogin();
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || !ref.current) return;
    let cancelled = false;

    const init = () => {
      if (cancelled) return;
      const g = (window as unknown as { google?: any }).google;
      if (!g?.accounts) return;
      g.accounts.id.initialize({
        callback: (resp: { credential?: string }) => {
          if (resp.credential) mutation.mutate(resp.credential);
        },
      });
      if (ref.current) {
        g.accounts.id.renderButton(ref.current, {
          theme: "outline",
          size: "large",
          shape: "pill",
          text: "continue_with",
          width: 300,
        });
      }
    };

    const w = window as unknown as { google?: any };
    if (w.google?.accounts) {
      init();
      return () => {
        cancelled = true;
      };
    }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = init;
    document.head.appendChild(s);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  if (!clientId) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="flex w-full justify-center">
        <div ref={ref} />
      </div>
    </div>
  );
}
