"use client";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { LogOut, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems } from "@/config/nav-items";
import { SidebarLogo } from "./sidebar-logo";
import { SidebarProfile } from "./sidebar-profile";
import { SidebarNavItem } from "./sidebar-nav-item";
import { useAuth } from "@/hooks/use-auth";
export function Sidebar({ isOpen, onClose, hidden = false }: { isOpen: boolean; onClose: () => void; hidden?: boolean }) {
  const pathname = usePathname(); const { logout } = useAuth();
  const group = (title: string, paths: string[]) => <><p className="px-2.5 pb-1.5 pt-4 text-[10.5px] font-extrabold uppercase tracking-[.1em] text-muted-foreground">{title}</p>{navItems.filter(item => paths.includes(item.href)).map(item => <SidebarNavItem key={item.href} item={item} isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"))} onClose={onClose} />)}</>;
  return <>{isOpen && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onClose} />}<aside className={cn("fixed inset-y-0 left-0 z-50 flex w-[248px] shrink-0 flex-col border-r border-border bg-card transition-transform duration-300 md:static md:translate-x-0", hidden && "md:hidden", isOpen ? "translate-x-0" : "-translate-x-full")}><SidebarLogo /><Button className="mx-3.5 min-h-[42px]" onClick={() => { onClose(); window.dispatchEvent(new Event("stash:capture")); }}><Plus size={17} /> Capture</Button><button onClick={() => { onClose(); window.dispatchEvent(new Event("stash:search")); }} className="mx-3.5 mt-2 flex min-h-10 items-center gap-2 rounded-lg bg-accent px-3 text-left text-[13px] text-muted-foreground hover:text-foreground"><Search size={16} /> Find anything… <kbd className="ml-auto rounded border border-border px-1.5 text-[10px]">⌘K</kbd></button><nav aria-label="Primary" className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-3">{group("Workspace", ["/dashboard", "/links", "/notes", "/notebooks", "/words", "/pad"])}{group("Assistant", ["/chat"])}{group("Manage", ["/settings"])}</nav><div className="flex items-center border-t border-border py-2"><div className="min-w-0 flex-1"><SidebarProfile /></div><button onClick={logout} className="mr-4 rounded-lg p-2 text-muted-foreground hover:bg-accent" aria-label="Sign out"><LogOut size={17} /></button></div></aside></>;
}
