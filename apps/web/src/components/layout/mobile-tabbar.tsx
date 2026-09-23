"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  FileText,
  Link2,
  NotebookPen,
  Settings,
} from "lucide-react";

const tabs = [
  { href: "/dashboard", label: "Home", icon: LayoutGrid },
  { href: "/notes", label: "Notes", icon: FileText },
  { href: "/links", label: "Links", icon: Link2 },
  { href: "/pad", label: "Pads", icon: NotebookPen },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-sidebar/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-5">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 py-2.5"
            >
              <Icon
                className="h-5 w-5"
                style={{
                  color: active ? "var(--primary)" : "var(--muted-foreground)",
                }}
              />
              <span
                className="text-[10px] font-medium"
                style={{
                  color: active ? "var(--primary)" : "var(--muted-foreground)",
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
