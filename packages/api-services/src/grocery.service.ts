import type { HttpClient, ApiSuccessResponse } from "./http-client";
import type { AddGroceryItemInput, UpdateGroceryItemInput } from "@repo/contracts/schemas";

import type { GroceryItem } from "@repo/contracts/types";

export function createGroceryService(client: HttpClient) {
  return {
    async getItems(): Promise<GroceryItem[]> {
      const res = await client.get<ApiSuccessResponse<GroceryItem[]>>("/api/grocery");
      return (res as unknown as ApiSuccessResponse<GroceryItem[]>).data ?? [];
    },

    async addItem(payload: AddGroceryItemInput): Promise<GroceryItem> {
      const res = await client.post<ApiSuccessResponse<GroceryItem>>("/api/grocery", payload);
      return (res as unknown as ApiSuccessResponse<GroceryItem>).data;
    },

    async addBulk(items: string[]): Promise<GroceryItem[]> {
      const res = await client.post<ApiSuccessResponse<GroceryItem[]>>("/api/grocery/bulk", { items });
      return (res as unknown as ApiSuccessResponse<GroceryItem[]>).data;
    },

    async updateItem(id: string, payload: UpdateGroceryItemInput): Promise<GroceryItem> {
      const res = await client.patch<ApiSuccessResponse<GroceryItem>>(`/api/grocery/${id}`, payload);
      return (res as unknown as ApiSuccessResponse<GroceryItem>).data;
    },

    async toggleItem(id: string): Promise<GroceryItem> {
      const res = await client.patch<ApiSuccessResponse<GroceryItem>>(`/api/grocery/${id}/toggle`);
      return (res as unknown as ApiSuccessResponse<GroceryItem>).data;
    },

    async deleteItem(id: string): Promise<void> {
      await client.delete(`/api/grocery/${id}`);
    },

    async clearCompleted(): Promise<void> {
      await client.delete("/api/grocery/clear/completed");
    },

    async clearAll(): Promise<void> {
      await client.delete("/api/grocery/clear/all");
    },
  };
}

export type GroceryService = ReturnType<typeof createGroceryService>;