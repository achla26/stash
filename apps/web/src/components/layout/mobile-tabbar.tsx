"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, FileText, Link2, Plus, SpellCheck } from "lucide-react";
const before = [{href:"/dashboard",label:"Home",icon:LayoutGrid},{href:"/links",label:"Links",icon:Link2}];
const after = [{href:"/notes",label:"Notes",icon:FileText},{href:"/words",label:"Words",icon:SpellCheck}];
export function MobileTabBar() {
  const pathname = usePathname();
  const item = ({href,label,icon:Icon}: typeof before[number]) => <Link key={href} href={href} aria-current={pathname.startsWith(href) ? "page" : undefined} className={`proto-mobile-item ${pathname.startsWith(href) ? "active" : ""}`}><Icon size={19}/>{label}</Link>;
  return <nav aria-label="Mobile" className="proto-mobile-nav">{before.map(item)}<button className="proto-mobile-capture" onClick={() => window.dispatchEvent(new Event("stash:capture"))}><Plus size={19}/>Capture</button>{after.map(item)}</nav>;
}
