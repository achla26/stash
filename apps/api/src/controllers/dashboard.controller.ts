import { Context } from "hono";
import { DashboardService } from "../services/dashboard.service";
import { ApiResponse } from "../lib/api-response";

export class DashboardController {
  static async getDashboard(c: Context) {
    const userId = c.get("user").id as string;
    const data = await DashboardService.getDashboard(userId);
    return ApiResponse.success(c, data);
  }

  static async getStats(c: Context) {
    const userId = c.get("user").id as string;
    const stats = await DashboardService.getStats(userId);
    return ApiResponse.success(c, stats);
  }

  static async getRecent(c: Context) {
    const userId = c.get("user").id as string;
    const items = await DashboardService.getRecent(userId);
    return ApiResponse.success(c, items);
  }
}