import Link from "next/link";
import { cn } from "@/lib/utils";
export interface NavItem { href: string; label: string; icon: React.ElementType; comingSoon?: boolean }
export function SidebarNavItem({ item, isActive, onClose }: { item: NavItem; isActive: boolean; onClose: () => void }) {
  const Icon = item.icon;
  return <Link href={item.href} onClick={onClose} aria-current={isActive ? "page" : undefined} className={cn("flex min-h-10 items-center gap-2.5 rounded-lg px-2.5 text-[13.5px] font-semibold transition-colors", isActive ? "bg-foreground text-background" : "text-muted-foreground hover:bg-accent hover:text-foreground")}><Icon className="h-[17px] w-[17px]" /><span>{item.label}</span></Link>;
}
