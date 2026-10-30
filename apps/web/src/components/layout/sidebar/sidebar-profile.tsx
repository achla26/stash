"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
export function SidebarProfile() {
  const [user, setUser] = useState<{name?: string; email?: string} | null>(null);
  useEffect(() => { try { const raw = localStorage.getItem("user"); if (raw) setUser(JSON.parse(raw)); } catch {} }, []);
  const name = user?.name || user?.email?.split("@")[0] || "You";
  return <Link href="/settings" className="mx-3 flex min-w-0 items-center gap-2.5 rounded-lg p-1.5 hover:bg-accent"><span className="flex h-[33px] w-[33px] shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{name.slice(0,1).toUpperCase()}</span><span className="min-w-0"><span className="block truncate text-[13px] font-bold">{name}</span><span className="block truncate text-[11px] text-muted-foreground">{user?.email || "Account settings"}</span></span></Link>;
}
