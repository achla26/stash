"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { MobileTabBar } from "@/components/layout/mobile-tabbar";
import { QuickAddButton } from "@/components/layout/quick-add-button";
import { useAuth } from "@/hooks/use-auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(false);

  useEffect(() => {
    setSidebarHidden(localStorage.getItem("stash_sidebar_hidden") === "1");
  }, []);

  const toggleSidebar = () => {
    setSidebarHidden((h) => {
      const next = !h;
      localStorage.setItem("stash_sidebar_hidden", next ? "1" : "0");
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile Header */}
      <MobileHeader onMenuClick={() => setSidebarOpen(true)} />

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        hidden={sidebarHidden}
      />

      {/* Main Content */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden pt-14 md:pt-0">
        <TopBar onToggleSidebar={toggleSidebar} />
        <div className="flex-1 overflow-auto p-4 pb-24 md:p-6 md:pb-6 app-scrollbar">
          {children}
        </div>
      </main>

      {/* Quick Add FAB */}
      <QuickAddButton />

      {/* Mobile bottom tabs */}
      <MobileTabBar />
    </div>
  );
}