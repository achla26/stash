import type { HttpClient, ApiSuccessResponse } from "./http-client";
import type { DashboardData, DashboardStats, RecentItem } from "@repo/contracts/types";

export function createDashboardService(client: HttpClient) {
  return {
    async getDashboard(): Promise<DashboardData> {
      const res = await client.get<ApiSuccessResponse<DashboardData>>("/api/dashboard");
      return (res as unknown as ApiSuccessResponse<DashboardData>).data;
    },

    async getStats(): Promise<DashboardStats> {
      const res = await client.get<ApiSuccessResponse<DashboardStats>>("/api/dashboard/stats");
      return (res as unknown as ApiSuccessResponse<DashboardStats>).data;
    },

    async getRecent(): Promise<RecentItem[]> {
      const res = await client.get<ApiSuccessResponse<RecentItem[]>>("/api/dashboard/recent");
      return (res as unknown as ApiSuccessResponse<RecentItem[]>).data ?? [];
    },
  };
}

export type DashboardService = ReturnType<typeof createDashboardService>;