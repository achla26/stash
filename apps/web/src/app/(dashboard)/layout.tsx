"use client";

import { useEffect, useState } from "react";
import { AppShellSkeleton } from "@/components/shared/skeletons/page-skeleton";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { MobileTabBar } from "@/components/layout/mobile-tabbar";
import { CreateLinkDialog } from "@/components/links/create-link-dialog";
import { useAuth } from "@/hooks/use-auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);
  useEffect(() => { const open = () => setCaptureOpen(true); window.addEventListener("stash:capture", open); return () => window.removeEventListener("stash:capture", open); }, []);
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
      <AppShellSkeleton />
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen w-full min-w-0 overflow-hidden bg-background">
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
        <div className="bg-background-secondary min-h-0 min-w-0 w-full flex-1 overflow-y-auto overflow-x-hidden p-4 pb-24 md:p-6 md:pb-6 app-scrollbar">
          {children}
        </div>
      </main>

      <CreateLinkDialog isOpen={captureOpen} onClose={() => setCaptureOpen(false)} />

      {/* Mobile bottom tabs */}
      <MobileTabBar />
    </div>
  );
}