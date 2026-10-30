"use client";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Search, Menu, Plus } from "lucide-react";
import { SearchDialog } from "@/components/search/search-dialog";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { navItems } from "@/config/nav-items";
export function TopBar({ onToggleSidebar }: { onToggleSidebar?: () => void } = {}) {
  const [searchOpen, setSearchOpen] = useState(false); const pathname = usePathname();
  useEffect(() => { const key = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSearchOpen(o => !o); } }; const open = () => setSearchOpen(true); window.addEventListener("keydown", key); window.addEventListener("stash:search", open); return () => { window.removeEventListener("keydown", key); window.removeEventListener("stash:search", open); }; }, []);
  const title = pathname.startsWith("/dashboard") ? "Dashboard" : navItems.find(item => pathname === item.href || pathname.startsWith(item.href + "/"))?.label || "Stash";
  return <><header className="hidden h-[60px] shrink-0 items-center gap-3 border-b border-border bg-background px-[22px] md:flex"><button onClick={onToggleSidebar} aria-label="Toggle sidebar" className="rounded-lg p-2 text-muted-foreground hover:bg-accent"><Menu size={17}/></button><h2 className="text-base font-bold">{title}</h2><div className="flex-1"/><ThemeToggle /><button onClick={() => setSearchOpen(true)} className="flex min-h-[38px] items-center gap-2 rounded-lg border border-border bg-card px-3 text-[13px] font-semibold text-muted-foreground hover:bg-accent"><Search size={16}/> Find… <kbd className="ml-2 rounded border border-border px-1.5 text-[10px]">⌘K</kbd></button><Button onClick={() => window.dispatchEvent(new Event("stash:capture"))}><Plus size={16}/> Capture</Button></header><SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} /></>;
}
