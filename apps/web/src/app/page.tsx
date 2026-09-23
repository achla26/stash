"use client";

import { useEffect } from "react";

export default function RootPage() {
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    window.location.replace(token ? "/dashboard" : "/login");
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <p className="text-sm text-muted-foreground">Loading Stash...</p>
    </main>
  );
}
