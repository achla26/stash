"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useCreateLink } from "@/hooks/use-links";
import { toast } from "sonner";

function extractUrl(parts: (string | null)[]): string | null {
  for (const p of parts) {
    if (!p) continue;
    const m = p.match(/https?:\/\/[^\s]+/);
    if (m) return m[0];
  }
  return null;
}

function ShareHandler() {
  const router = useRouter();
  const params = useSearchParams();
  const createLink = useCreateLink();
  const [msg, setMsg] = useState("Saving shared link…");

  useEffect(() => {
    const rawUrl = params.get("url");
    const title = params.get("title") ?? "";
    const text = params.get("text") ?? "";
    const url = extractUrl([rawUrl, text, title]);

    if (!url) {
      setMsg("No link found in share.");
      setTimeout(() => router.push("/links"), 1500);
      return;
    }

    const authed = !!localStorage.getItem("access_token");
    if (!authed) {
      localStorage.setItem(
        "stash_pending_share",
        JSON.stringify({ url, title: title || text.slice(0, 120) })
      );
      setMsg("Please log in — we'll save the link after.");
      router.push("/login");
      return;
    }

    createLink.mutate(
      { url, title: title || undefined, description: undefined },
      {
        onSuccess: () => {
          toast.success("Link saved from share!");
          router.push("/links");
        },
        onError: (e) => {
          setMsg((e as Error).message);
          setTimeout(() => router.push("/links"), 1500);
        },
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background p-6 text-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{msg}</p>
    </div>
  );
}

export default function SharePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ShareHandler />
    </Suspense>
  );
}