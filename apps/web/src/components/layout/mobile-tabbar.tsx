"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, FileText, Link2, Plus, SpellCheck } from "lucide-react";
const before = [{href:"/dashboard",label:"Home",icon:LayoutGrid},{href:"/links",label:"Links",icon:Link2}];
const after = [{href:"/notes",label:"Notes",icon:FileText},{href:"/words",label:"Words",icon:SpellCheck}];
export function MobileTabBar() {
  const pathname = usePathname();
  const item = ({href,label,icon:Icon}: typeof before[number]) => <Link key={href} href={href} aria-current={pathname.startsWith(href) ? "page" : undefined} className={`flex min-h-[50px] min-w-0 flex-1 flex-col items-center justify-center gap-[3px] rounded-[10px] text-[10.5px] font-bold ${pathname.startsWith(href) ? "text-primary" : "text-muted-foreground"}`}><Icon size={19}/>{label}</Link>;
  return <nav aria-label="Mobile" className="fixed inset-x-0 bottom-0 z-30 flex gap-0.5 border-t border-border bg-card px-2 pb-[calc(6px+env(safe-area-inset-bottom))] pt-1.5 md:hidden">{before.map(item)}<button className="flex min-h-[50px] min-w-0 flex-1 flex-col items-center justify-center gap-[3px] rounded-[13px] bg-primary text-[10.5px] font-bold text-primary-foreground" onClick={() => window.dispatchEvent(new Event("stash:capture"))}><Plus size={19}/>Capture</button>{after.map(item)}</nav>;
}
