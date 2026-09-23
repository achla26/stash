"use client";

import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

import { cn } from "@/lib/utils";
import { navItems } from "@/config/nav-items";
import { SidebarLogo } from "./sidebar-logo";
import { SidebarProfile } from "./sidebar-profile";
import { SidebarNavItem } from "./sidebar-nav-item";
import { useAuth } from "@/hooks/use-auth";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose, hidden = false }: SidebarProps & { hidden?: boolean }) {
  const pathname = usePathname();
    const { logout } = useAuth();
  

  // const handleLogout = () => {
  //   localStorage.removeItem("access_token");
  //   localStorage.removeItem("refresh_token");
  //   localStorage.removeItem("user");
  //   window.location.href = "/login";
  // };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col",
          "border-r border-border bg-background",
          "transition-transform duration-300 ease-in-out",
          "md:static md:translate-x-0",
          hidden && "md:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarLogo />
        <SidebarProfile />

        <nav className="flex-1 space-y-1 overflow-y-auto p-4 app-scrollbar">
          {navItems.map((item) => (
            <SidebarNavItem
              key={item.href}
              item={item}
              isActive={pathname === item.href}
              onClose={onClose}
            />
          ))}
        </nav>

        <div className="border-t border-border p-4">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}