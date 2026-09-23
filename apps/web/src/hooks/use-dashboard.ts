"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/lib/services";
const dashboardKeys = {
  all: ["dashboard"] as const,
  stats: ["dashboard", "stats"] as const,
  recent: ["dashboard", "recent"] as const,
};

export function useDashboard() {
  return useQuery({
    queryKey: dashboardKeys.all,
    queryFn: dashboardService.getDashboard,
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats,
    queryFn: dashboardService.getStats,
  });
}

export function useDashboardRecent() {
  return useQuery({
    queryKey: dashboardKeys.recent,
    queryFn: dashboardService.getRecent,
  });
}